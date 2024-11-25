'use client'
import { useState, useEffect, useRef } from 'react'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { toast } from 'sonner'
import voicesData from '@/data/voices.json'
import { RefreshCw, Wand2, Download, Mic, Radio } from 'lucide-react'

function useStatusMessage(isActive, activeMessage, inactiveMessage) {
  return isActive ? activeMessage : inactiveMessage
}

export default function PodcastStreamCreator() {
  const [prompt, setPrompt] = useState('')
  const [conversation, setConversation] = useState('')
  const [selectedVoice1, setSelectedVoice1] = useState('')
  const [selectedVoice2, setSelectedVoice2] = useState('')
  const [isGenerating, setIsGenerating] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [isBuffering, setIsBuffering] = useState(false)
  const [duration, setDuration] = useState(0)
  const [downloadUrl, setDownloadUrl] = useState(null)
  const audioRef = useRef(null)

  const conversationMessage = useStatusMessage(
    isGenerating,
    'Generating Podcast Script...',
    'Generate Podcast Script'
  )
  const audioMessage = useStatusMessage(
    isLoading || isBuffering,
    'Generating Podcast...',
    'Generate Podcast'
  )

  const resetState = () => {
    console.log('[Page] Resetting state')
    if (audioRef.current) {
      audioRef.current.pause()
      audioRef.current.src = ''
    }
    setPrompt('')
    setConversation('')
    setSelectedVoice1('')
    setSelectedVoice2('')
    setIsBuffering(false)
    setIsLoading(false)
    setDuration(0)
    setDownloadUrl(null)
  }

  const generateConversation = async () => {
    try {
      console.log('[Page] Generating conversation')
      setIsGenerating(true)
      const response = await fetch('/api/generate-conversation', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ prompt }),
      })

      if (!response.ok) {
        throw new Error('Failed to generate conversation')
      }

      const data = await response.json()
      setConversation(data.story)
      toast.success('Conversation generated successfully!')
    } catch (error) {
      console.error('[Page] Conversation generation error:', error)
      toast.error('Failed to generate conversation')
    } finally {
      setIsGenerating(false)
    }
  }

  const generatePodcast = async () => {
    try {
      console.log('[Page] Starting podcast generation')
      if (!selectedVoice1 || !selectedVoice2 || !conversation) {
        toast.error(
          'Please select both voices and generate a conversation first'
        )
        return
      }

      setIsLoading(true)
      setIsBuffering(true)
      setDownloadUrl(null)
      console.log('[Page] Selected voices:', {
        voice1: selectedVoice1,
        voice2: selectedVoice2,
      })

      while (!audioRef.current) {
        await new Promise((resolve) => setTimeout(resolve, 100))
      }

      const audio = audioRef.current
      const mediaSource = new MediaSource()
      audio.src = URL.createObjectURL(mediaSource)

      let audioChunks = []

      mediaSource.addEventListener('sourceopen', async () => {
        try {
          console.log('[Page] MediaSource opened')
          const sourceBuffer = mediaSource.addSourceBuffer('audio/mpeg')

          sourceBuffer.addEventListener('updateend', () => {
            if (sourceBuffer.buffered.length > 0) {
              const newDuration = sourceBuffer.buffered.end(
                sourceBuffer.buffered.length - 1
              )
              setDuration(newDuration)
            }
          })

          const response = await fetch('/api/generate-podcast-stream', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              voice1: selectedVoice1,
              voice2: selectedVoice2,
              conversation,
            }),
          })

          if (!response.ok) {
            throw new Error('Failed to generate podcast')
          }

          console.log('[Page] Stream response received')
          const reader = response.body.getReader()
          let totalBytes = 0

          while (true) {
            const { done, value } = await reader.read()

            if (done) {
              console.log('[Page] Stream complete. Total bytes:', totalBytes)

              await waitForSourceBufferIdle(sourceBuffer)

              try {
                mediaSource.endOfStream()
                console.log('[Page] MediaSource ended successfully.')
              } catch (error) {
                console.error(
                  '[Page] Error calling mediaSource.endOfStream():',
                  error
                )
              }
              setIsBuffering(false)
              setIsLoading(false)

              const audioBlob = new Blob(audioChunks, { type: 'audio/mpeg' })
              const downloadUrl = URL.createObjectURL(audioBlob)
              setDownloadUrl(downloadUrl)
              break
            }

            totalBytes += value.length
            audioChunks.push(value)

            await waitForSourceBuffer(sourceBuffer)

            try {
              sourceBuffer.appendBuffer(value)
            } catch (error) {
              console.error('[Page] Error appending buffer:', error)
            }

            if (
              audio.paused &&
              sourceBuffer.buffered.length > 0 &&
              sourceBuffer.buffered.end(0) >= 1
            ) {
              console.log('[Page] Starting playback')
              audio.play().catch(console.error)
            }
          }

          toast.success('Podcast generation completed!')
        } catch (error) {
          console.error('[Page] Streaming error:', error)
          toast.error('Failed to stream podcast')
          setIsLoading(false)
          setIsBuffering(false)
        }
      })

      audio.addEventListener('loadedmetadata', () => {
        if (duration > 0) {
          audio.duration = duration
        }
      })

      audio.addEventListener('error', (e) => {
        console.error('[Page] Audio error:', e)
        toast.error('Error playing audio')
      })
    } catch (error) {
      console.error('[Page] Error in generatePodcast:', error)
      toast.error(error.message || 'Failed to generate podcast')
      setIsLoading(false)
      setIsBuffering(false)
    }
  }

  function waitForSourceBufferIdle(sourceBuffer) {
    return new Promise((resolve) => {
      function checkIdle() {
        if (!sourceBuffer.updating) {
          setTimeout(() => {
            if (!sourceBuffer.updating) {
              resolve()
            } else {
              sourceBuffer.addEventListener('updateend', checkIdle, {
                once: true,
              })
            }
          }, 0)
        } else {
          sourceBuffer.addEventListener('updateend', checkIdle, { once: true })
        }
      }
      checkIdle()
    })
  }

  function waitForSourceBuffer(sourceBuffer) {
    return new Promise((resolve) => {
      if (!sourceBuffer.updating) {
        resolve()
      } else {
        sourceBuffer.addEventListener('updateend', resolve, { once: true })
      }
    })
  }

  useEffect(() => {
    return () => {
      console.log('[Page] Cleaning up')
      if (audioRef.current) {
        audioRef.current.pause()
        audioRef.current.src = ''
      }
    }
  }, [])

  useEffect(() => {
    return () => {
      if (downloadUrl) {
        URL.revokeObjectURL(downloadUrl)
      }
    }
  }, [downloadUrl])

  return (
    <div className='min-h-screen bg-gradient-to-b from-[#0f172a] to-[#1e293b] text-white py-8'>
      <div className='container mx-auto p-6'>
        <div className='max-w-7xl mx-auto'>
          <h1 className='text-5xl font-bold mb-8 text-center text-orange-500'>
            AI Podcast Creator
          </h1>
          <p className='text-xl text-center mb-12 text-gray-300'>
            Create stunning podcasts with AI-powered voices in with streaming
            feature.
          </p>

          {!conversation ? (
            <Card className='bg-[#1e293b]/80 border-[#334155] backdrop-blur-sm max-w-2xl mx-auto shadow-xl'>
              <CardHeader>
                <CardTitle className='text-3xl text-white flex items-center gap-3'>
                  <Wand2 className='w-8 h-8 text-orange-500' />
                  Create Your Podcast
                </CardTitle>
              </CardHeader>
              <CardContent className='space-y-6'>
                <div>
                  <label
                    htmlFor='prompt-input'
                    className='block text-lg font-medium mb-2 text-gray-300'
                  >
                    What would you like your podcast to be about?
                  </label>
                  <Textarea
                    id='prompt-input'
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    placeholder='Provide a podcast topic, and AI will create tailored content for it.'
                    className='h-40 bg-[#334155]/50 border-[#475569] text-white placeholder:text-gray-400 text-lg'
                    disabled={isGenerating}
                  />
                </div>
                <Button
                  onClick={generateConversation}
                  disabled={!prompt || isGenerating}
                  className='w-full bg-orange-500 hover:bg-orange-600 text-white text-lg py-6'
                >
                  {isGenerating ? (
                    <RefreshCw className='w-6 h-6 mr-2 animate-spin' />
                  ) : (
                    <Wand2 className='w-6 h-6 mr-2' />
                  )}
                  {conversationMessage}
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className='grid grid-cols-1 lg:grid-cols-2 gap-8 mb-6'>
              <Card className='bg-[#1e293b]/80 border-[#334155] backdrop-blur-sm shadow-xl'>
                <CardHeader>
                  <CardTitle className='text-3xl text-white flex items-center gap-3'>
                    <Radio className='w-8 h-8 text-orange-500' />
                    Generated Script
                  </CardTitle>
                </CardHeader>
                <CardContent className='space-y-4'>
                  <Textarea
                    value={conversation}
                    readOnly
                    className='h-[400px] bg-[#334155]/50 border-[#475569] text-white text-lg'
                  />
                  <Button
                    onClick={resetState}
                    variant='outline'
                    className='w-full border-orange-500 text-orange-500 hover:bg-orange-500 hover:text-white text-lg py-6'
                  >
                    <RefreshCw className='w-6 h-6 mr-2' />
                    Start Over
                  </Button>
                </CardContent>
              </Card>

              <Card className='bg-[#1e293b]/80 border-[#334155] backdrop-blur-sm shadow-xl'>
                <CardHeader>
                  <CardTitle className='text-3xl text-white flex items-center gap-3'>
                    <Mic className='w-8 h-8 text-orange-500' />
                    Voice Selection
                  </CardTitle>
                </CardHeader>
                <CardContent className='space-y-6'>
                  <div className='space-y-4'>
                    {[
                      {
                        label: 'Select Voice 1',
                        value: selectedVoice1,
                        setter: setSelectedVoice1,
                      },
                      {
                        label: 'Select Voice 2',
                        value: selectedVoice2,
                        setter: setSelectedVoice2,
                      },
                    ].map((voice, index) => (
                      <div key={index}>
                        <label className='block text-lg font-medium mb-2 text-gray-300'>
                          {voice.label}
                        </label>
                        <Select
                          value={voice.value}
                          onValueChange={voice.setter}
                          disabled={isLoading}
                        >
                          <SelectTrigger className='w-full bg-[#334155]/50 border-[#475569] text-white text-lg'>
                            <SelectValue
                              placeholder={`Select ${
                                index === 0 ? 'first' : 'second'
                              } voice`}
                            />
                          </SelectTrigger>
                          <SelectContent className='bg-[#334155] border-[#475569]'>
                            {voicesData.default_voices.map((v) => (
                              <SelectItem
                                key={v.id}
                                value={v.id}
                                className='text-white focus:bg-[#475569] focus:text-white'
                              >
                                {v.voice} ({v.accent}, {v.gender}, {v.age})
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    ))}
                  </div>

                  <Button
                    onClick={generatePodcast}
                    disabled={
                      !selectedVoice1 ||
                      !selectedVoice2 ||
                      isLoading ||
                      isBuffering
                    }
                    className='w-full bg-orange-500 hover:bg-orange-600 text-white text-lg py-6'
                  >
                    {isLoading || isBuffering ? (
                      <RefreshCw className='w-6 h-6 mr-2 animate-spin' />
                    ) : (
                      <Radio className='w-6 h-6 mr-2' />
                    )}
                    {audioMessage}
                  </Button>

                  {(isLoading ||
                    isBuffering ||
                    (audioRef.current && audioRef.current.src)) && (
                    <Card className='bg-[#1e293b]/60 border-[#334155] mt-4'>
                      <CardHeader>
                        <CardTitle className='text-2xl text-white flex items-center justify-between'>
                          <span>Your Generated Podcast</span>
                          {downloadUrl && (
                            <a
                              href={downloadUrl}
                              download='podcast.mp3'
                              className='text-orange-500 hover:text-orange-600'
                            >
                              <Download className='w-6 h-6' />
                            </a>
                          )}
                        </CardTitle>
                      </CardHeader>
                      <CardContent className='space-y-4'>
                        {isBuffering && (
                          <div className='text-lg text-gray-400 text-center'>
                            Buffering audio stream...
                          </div>
                        )}
                        <div className='w-full bg-[#334155]/50 rounded-lg p-4'>
                          <audio
                            ref={audioRef}
                            controls
                            className='w-full'
                            onError={(e) => {
                              console.error('[Page] Audio error:', e)
                              toast.error('Error playing audio')
                            }}
                          >
                            Your browser does not support the audio element.
                          </audio>
                        </div>
                        <div className='text-lg text-gray-400 text-center'>
                          {duration > 0 &&
                            `Duration: ${duration.toFixed(2)} seconds`}
                        </div>
                        <Button
                          onClick={resetState}
                          variant='outline'
                          className='w-full border-orange-500 text-orange-500 hover:bg-orange-500 hover:text-white text-lg py-6'
                        >
                          <RefreshCw className='w-6 h-6 mr-2' />
                          Create Another Podcast
                        </Button>
                      </CardContent>
                    </Card>
                  )}
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
