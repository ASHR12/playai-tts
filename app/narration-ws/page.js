'use client'

import { useState, useRef, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Slider } from '@/components/ui/slider'
import { Mic, Wand2, RefreshCw } from 'lucide-react'
import voicesData from '@/data/voices.json'

const MAX_TEXT_LENGTH = 5000
const MAX_RECONNECT_ATTEMPTS = 3
const INACTIVITY_TIMEOUT = 10 * 60 * 1000 // 10 minutes
const TOKEN_REFRESH_INTERVAL = 5 * 60 * 1000 // 5 minutes

export default function TTS() {
  const [text, setText] = useState('')
  const [isConverting, setIsConverting] = useState(false)
  const [error, setError] = useState('')
  const [selectedVoice, setSelectedVoice] = useState('')
  const [temperature, setTemperature] = useState(0.7)

  const audioRef = useRef(null)
  const mediaSourceRef = useRef(null)
  const sourceBufferRef = useRef(null)
  const wsRef = useRef(null)
  const bufferQueue = useRef([])
  const tokenData = useRef(null)
  const inactivityTimeoutRef = useRef(null)
  const reconnectAttempts = useRef(0)
  const conversionCompleted = useRef(false)

  const cleanup = () => {
    if (mediaSourceRef.current?.readyState === 'open') {
      mediaSourceRef.current.endOfStream()
    }

    if (audioRef.current) {
      audioRef.current.pause()
      if (audioRef.current.src) {
        URL.revokeObjectURL(audioRef.current.src)
      }
      audioRef.current.removeAttribute('src')
      audioRef.current.load()
    }

    if (wsRef.current) {
      wsRef.current.close()
    }

    if (inactivityTimeoutRef.current) {
      clearTimeout(inactivityTimeoutRef.current)
    }

    bufferQueue.current = []
    sourceBufferRef.current = null
    mediaSourceRef.current = null
    wsRef.current = null
    conversionCompleted.current = false
  }

  const fetchToken = async () => {
    try {
      const response = await fetch('/api/get-ws-url', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      })

      const data = await response.json()
      if (!response.ok) throw new Error(data.error || 'Failed to get token')

      tokenData.current = {
        webSocketUrl: data['Play3.0-mini'].webSocketUrl,
        expiresAt: new Date(data.expiresAt).getTime(),
      }
      console.log('Token fetched successfully')
      return tokenData.current.webSocketUrl
    } catch (error) {
      console.error('Token Fetch Error:', error)
      setError(error.message)
      setIsConverting(false)
      return null
    }
  }

  const isTokenValid = () => {
    return (
      tokenData.current &&
      tokenData.current.expiresAt &&
      Date.now() < tokenData.current.expiresAt
    )
  }

  const initializeMediaSource = () => {
    return new Promise((resolve, reject) => {
      mediaSourceRef.current = new MediaSource()
      audioRef.current.src = URL.createObjectURL(mediaSourceRef.current)

      mediaSourceRef.current.addEventListener(
        'sourceopen',
        () => {
          try {
            const mimeType = 'audio/mpeg'
            if (!MediaSource.isTypeSupported(mimeType)) {
              throw new Error('Unsupported MIME type for audio')
            }

            sourceBufferRef.current =
              mediaSourceRef.current.addSourceBuffer(mimeType)
            sourceBufferRef.current.mode = 'sequence'
            sourceBufferRef.current.addEventListener('updateend', () => {
              if (
                !sourceBufferRef.current.updating &&
                bufferQueue.current.length > 0
              ) {
                processBufferQueue()
              }
            })

            resolve()
          } catch (e) {
            reject(
              new Error(
                'Failed to initialize audio source buffer: ' + e.message
              )
            )
          }
        },
        { once: true }
      )
    })
  }

  const processBufferQueue = () => {
    if (
      !sourceBufferRef.current ||
      sourceBufferRef.current.updating ||
      bufferQueue.current.length === 0
    ) {
      return
    }

    try {
      const chunk = bufferQueue.current.shift()
      sourceBufferRef.current.appendBuffer(chunk)
    } catch (error) {
      console.error('Error appending buffer:', error)
      if (error.name === 'QuotaExceededError') {
        if (sourceBufferRef.current && !sourceBufferRef.current.updating) {
          sourceBufferRef.current.remove(
            0,
            sourceBufferRef.current.buffered.end(0) / 2
          )
        }
        bufferQueue.current.unshift(chunk)
      }
    }
  }

  const startInactivityTimeout = () => {
    if (inactivityTimeoutRef.current) clearTimeout(inactivityTimeoutRef.current)
    inactivityTimeoutRef.current = setTimeout(() => {
      console.log('Inactivity timeout reached, cleaning up')
      cleanup()
    }, INACTIVITY_TIMEOUT)
  }

  const resetInactivityTimeout = () => {
    if (inactivityTimeoutRef.current) clearTimeout(inactivityTimeoutRef.current)
    startInactivityTimeout()
  }

  const handleWSMessage = async (event) => {
    resetInactivityTimeout()

    if (event.data instanceof ArrayBuffer) {
      const chunk = new Uint8Array(event.data)
      if (chunk.length > 0) {
        bufferQueue.current.push(chunk)
        if (!sourceBufferRef.current.updating) {
          processBufferQueue()
        }

        if (audioRef.current.paused) {
          try {
            await audioRef.current.play()
          } catch (e) {
            console.error('Playback error:', e)
          }
        }
      }
    } else {
      try {
        const message = JSON.parse(event.data)
        if (message.error) {
          throw new Error(message.error)
        }
        if (message.status === 'completed') {
          console.log('Conversion completed')
          conversionCompleted.current = true
          if (mediaSourceRef.current?.readyState === 'open') {
            mediaSourceRef.current.endOfStream()
          }
          setIsConverting(false)
        }
      } catch (e) {
        console.error('Message handling error:', e)
        setError(e.message)
        setIsConverting(false)
        cleanup()
      }
    }
  }

  const generateSpeech = async () => {
    if (!text.trim() || !selectedVoice) return

    if (text.length > MAX_TEXT_LENGTH) {
      setError(
        `Text is too long. Maximum length is ${MAX_TEXT_LENGTH} characters.`
      )
      return
    }

    cleanup()
    setIsConverting(true)
    setError('')
    reconnectAttempts.current = 0

    try {
      let wsUrl = tokenData.current?.webSocketUrl
      if (!isTokenValid()) {
        console.log('Token is invalid or expired, fetching new token')
        wsUrl = await fetchToken()
        if (!wsUrl) throw new Error('Failed to obtain WebSocket URL')
      }

      await initializeMediaSource()

      wsRef.current = new WebSocket(wsUrl)
      wsRef.current.binaryType = 'arraybuffer'

      wsRef.current.onopen = () => {
        console.log('WebSocket connection opened')
        const ttsCommand = {
          text: text.trim(),
          voice: selectedVoice,
          output_format: 'mp3',
          temperature: temperature,
          request_id: Date.now().toString(),
        }
        wsRef.current.send(JSON.stringify(ttsCommand))
        startInactivityTimeout()
      }

      wsRef.current.onmessage = handleWSMessage

      wsRef.current.onerror = (error) => {
        console.error('WebSocket error:', error)
        setError('Connection error occurred')
        setIsConverting(false)
      }

      wsRef.current.onclose = async (event) => {
        console.log(`WebSocket closed with code ${event.code}`)

        if (
          event.code !== 1000 &&
          isConverting &&
          !conversionCompleted.current
        ) {
          if (reconnectAttempts.current < MAX_RECONNECT_ATTEMPTS) {
            reconnectAttempts.current++
            console.log(
              `Attempting to reconnect (${reconnectAttempts.current}/${MAX_RECONNECT_ATTEMPTS})`
            )
            await generateSpeech()
          } else {
            setError('Connection lost. Please try again.')
            setIsConverting(false)
            cleanup()
          }
        } else {
          setIsConverting(false)
        }
      }
    } catch (error) {
      console.error('TTS Error:', error)
      setError(error.message)
      setIsConverting(false)
      cleanup()
    }
  }

  useEffect(() => {
    // Token refresh interval
    const tokenInterval = setInterval(() => {
      if (!isTokenValid()) {
        fetchToken()
      }
    }, TOKEN_REFRESH_INTERVAL)

    // Start inactivity timeout
    startInactivityTimeout()

    return () => {
      clearInterval(tokenInterval)
      cleanup()
    }
  }, [])

  return (
    <div className='min-h-screen bg-gradient-to-b from-[#0f172a] to-[#1e293b] text-white py-8'>
      <div className='container mx-auto p-6'>
        <div className='max-w-4xl mx-auto'>
          <h1 className='text-5xl font-bold mb-8 text-center text-orange-500'>
            AI Narration
          </h1>
          <p className='text-xl text-center mb-12 text-gray-300'>
            Create stunning narrations with AI-powered voices
          </p>

          <Card className='bg-[#1e293b]/80 border-[#334155] backdrop-blur-sm shadow-xl'>
            <CardHeader>
              <CardTitle className='text-3xl text-white flex items-center gap-3'>
                <Mic className='w-8 h-8 text-orange-500' />
                Generate Narration
              </CardTitle>
            </CardHeader>
            <CardContent className='space-y-6'>
              <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                <div>
                  <label className='block text-lg font-medium mb-2 text-gray-300'>
                    Select Voice
                  </label>
                  <Select
                    value={selectedVoice}
                    onValueChange={setSelectedVoice}
                    disabled={isConverting}
                  >
                    <SelectTrigger className='w-full bg-[#334155]/50 border-[#475569] text-white text-lg'>
                      <SelectValue placeholder='Select a voice' />
                    </SelectTrigger>
                    <SelectContent className='bg-[#334155] border-[#475569]'>
                      {voicesData.default_voices.map((voice) => (
                        <SelectItem
                          key={voice.id}
                          value={voice.id}
                          className='text-white focus:bg-[#475569] focus:text-white'
                        >
                          {voice.voice} ({voice.accent}, {voice.gender},{' '}
                          {voice.age})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label
                    htmlFor='temperature-slider'
                    className='block text-lg font-medium mb-2 text-gray-300'
                  >
                    Temperature: {temperature.toFixed(2)}
                  </label>
                  <Slider
                    id='temperature-slider'
                    min={0}
                    max={1}
                    step={0.01}
                    value={[temperature]}
                    onValueChange={(value) => setTemperature(value[0])}
                    disabled={isConverting}
                    className='w-full'
                  />
                </div>
              </div>

              <div>
                <label
                  htmlFor='text-input'
                  className='block text-lg font-medium mb-2 text-gray-300'
                >
                  Enter Text
                </label>
                <Textarea
                  id='text-input'
                  placeholder='Enter text to convert to speech...'
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  className='h-40 bg-[#334155]/50 border-[#475569] text-white placeholder:text-gray-400 text-lg'
                  maxLength={MAX_TEXT_LENGTH}
                  disabled={isConverting}
                />
                <p className='text-sm text-gray-400 mt-2'>
                  {text.length}/{MAX_TEXT_LENGTH} characters
                </p>
              </div>

              <Button
                onClick={generateSpeech}
                disabled={isConverting || !text.trim() || !selectedVoice}
                className='w-full bg-orange-500 hover:bg-orange-600 text-white text-lg py-6'
              >
                {isConverting ? (
                  <RefreshCw className='w-6 h-6 mr-2 animate-spin' />
                ) : (
                  <Wand2 className='w-6 h-6 mr-2' />
                )}
                {isConverting ? 'Generating...' : 'Generate Narration'}
              </Button>

              {error && (
                <div className='p-4 bg-red-500/20 border border-red-500 text-red-100 rounded-lg'>
                  {error}
                  <button
                    className='ml-2 text-sm underline hover:text-red-200'
                    onClick={() => setError('')}
                  >
                    Dismiss
                  </button>
                </div>
              )}

              {(isConverting || audioRef.current?.src) && (
                <Card
                  className='bg-[#1e293b]/60 
border-[#334155] mt-4'
                >
                  <CardHeader>
                    <CardTitle className='text-2xl text-white'>
                      Your Generated Narration
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <audio
                      ref={audioRef}
                      controls
                      className='w-full'
                      onError={(e) => {
                        console.error('Audio playback error:', e)
                        setError('Audio playback error')
                      }}
                    >
                      Your browser does not support the audio element.
                    </audio>
                  </CardContent>
                </Card>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
