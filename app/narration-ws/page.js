'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Slider } from '@/components/ui/slider'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { 
  Mic, 
  Wand2, 
  RefreshCw, 
  BookOpen, 
  Settings, 
  X,
  Volume2,
  VolumeX,
  PlayCircle,
  PauseCircle,
  Save,
  RotateCcw,
  AlertTriangle
} from 'lucide-react'
import voicesData from '@/data/voices.json'
import { useMediaSource } from '@/hooks/use-media-source'
import { useWebSocket } from '@/hooks/use-websocket'
import { useInactivityTimeout } from '@/hooks/use-inactivity-timeout'

// Constants
const MAX_TEXT_LENGTH = 5000
const MAX_RECONNECT_ATTEMPTS = 3
const INACTIVITY_TIMEOUT = 10 * 60 * 1000 // 10 minutes
const TOKEN_REFRESH_INTERVAL = 5 * 60 * 1000 // 5 minutes

export default function TTS() {
  // State variables
  const [text, setText] = useState('')
  const [isConverting, setIsConverting] = useState(false)
  const [error, setError] = useState('')
  const [selectedVoice, setSelectedVoice] = useState('')
  const [temperature, setTemperature] = useState(0.7)
  const [speed, setSpeed] = useState(1.0)
  const [isPlaying, setIsPlaying] = useState(false)
  const [processedTextLength, setProcessedTextLength] = useState(0)
  const [activeTab, setActiveTab] = useState('narration')
  const [isMuted, setIsMuted] = useState(false)
  const [savedAudios, setSavedAudios] = useState([])
  const [visibleAudioRef, setVisibleAudioRef] = useState(null)

  // Custom hooks
  const { 
    audioRef, 
    initializeMediaSource, 
    processAudioChunk, 
    endMediaStream,
    resetAudio 
  } = useMediaSource({
    onPlayStateChange: setIsPlaying,
    speed
  })

  const {
    connect,
    disconnect,
    sendMessage,
    isConnected
  } = useWebSocket({
    onChunkReceived: processAudioChunk,
    onComplete: () => {
      setIsConverting(false)
      endMediaStream()
    },
    onError: (errorMsg) => {
      setError(errorMsg)
      setIsConverting(false)
    },
    onProgress: (progress) => {
      setProcessedTextLength(Math.min(text.length * (progress / 100), text.length))
    }
  })

  const { resetInactivityTimeout } = useInactivityTimeout(INACTIVITY_TIMEOUT, () => {
    if (!isConverting) cleanup()
  })

  // Token management
  const [tokenData, setTokenData] = useState(null)

  const fetchToken = async () => {
    try {
      const response = await fetch('/api/get-ws-url', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      })

      const data = await response.json()
      if (!response.ok) throw new Error(data.error || 'Failed to get token')

      const newToken = {
        webSocketUrl: data['Play3.0-mini'].webSocketUrl,
        expiresAt: new Date(data.expiresAt).getTime(),
      }
      
      setTokenData(newToken)
      console.log('Token fetched successfully')
      return newToken.webSocketUrl
    } catch (error) {
      console.error('Token Fetch Error:', error)
      setError(error.message)
      setIsConverting(false)
      return null
    }
  }

  const isTokenValid = () => {
    return (
      tokenData &&
      tokenData.expiresAt &&
      Date.now() < tokenData.expiresAt
    )
  }

  // Main functionality
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
    setProcessedTextLength(0)

    try {
      // Get valid token and websocket URL
      let wsUrl = tokenData?.webSocketUrl
      if (!isTokenValid()) {
        console.log('Token is invalid or expired, fetching new token')
        wsUrl = await fetchToken()
        if (!wsUrl) throw new Error('Failed to obtain WebSocket URL')
      }

      // Initialize media source
      await initializeMediaSource()

      // Connect to websocket
      const connected = await connect(wsUrl, MAX_RECONNECT_ATTEMPTS)
      if (!connected) {
        throw new Error('Failed to connect to WebSocket server')
      }

      // Send TTS command
      const ttsCommand = {
        text: text.trim(),
        voice: selectedVoice,
        output_format: 'mp3',
        temperature: temperature,
        request_id: Date.now().toString(),
      }
      
      sendMessage(JSON.stringify(ttsCommand))
      resetInactivityTimeout()
    } catch (error) {
      console.error('TTS Error:', error)
      setError(error.message)
      setIsConverting(false)
      cleanup()
    }
  }

  const cleanup = () => {
    disconnect()
    resetAudio()
    resetInactivityTimeout()
  }

  const handleSaveAudio = () => {
    if (audioRef.current?.src) {
      const newSavedAudio = {
        id: Date.now(),
        voice: selectedVoice,
        text: text.length > 50 ? text.substring(0, 50) + '...' : text,
        src: audioRef.current.src,
        date: new Date().toLocaleString()
      }
      setSavedAudios([newSavedAudio, ...savedAudios])
    }
  }

  const handleTogglePlayback = () => {
    if (audioRef.current && visibleAudioRef) {
      if (isPlaying) {
        audioRef.current.pause();
        visibleAudioRef.pause();
      } else {
        audioRef.current.play();
        visibleAudioRef.play();
      }
    }
  }

  const handleToggleMute = () => {
    if (audioRef.current) {
      const newMutedState = !audioRef.current.muted;
      audioRef.current.muted = newMutedState;
      if (visibleAudioRef) {
        visibleAudioRef.muted = newMutedState;
      }
      setIsMuted(newMutedState);
    }
  }

  const handleSpeedChange = (value) => {
    const newSpeed = value[0];
    setSpeed(newSpeed);
    if (audioRef.current) {
      audioRef.current.playbackRate = newSpeed;
    }
    if (visibleAudioRef) {
      visibleAudioRef.playbackRate = newSpeed;
    }
  }

  useEffect(() => {
    // Initialize by fetching token
    fetchToken()

    // Token refresh interval
    const tokenInterval = setInterval(() => {
      if (!isTokenValid()) {
        fetchToken()
      }
    }, TOKEN_REFRESH_INTERVAL)

    return () => {
      clearInterval(tokenInterval)
      cleanup()
    }
  }, [])

  // UI Components
  const TabButton = ({ id, label, icon: Icon }) => (
    <Button 
      variant={activeTab === id ? "default" : "outline"} 
      className={`flex-1 flex gap-2 ${activeTab === id ? "bg-orange-500 hover:bg-orange-600 text-white" : "bg-transparent text-gray-300"}`}
      onClick={() => setActiveTab(id)}
    >
      <Icon className="w-5 h-5" />
      <span className="hidden sm:inline">{label}</span>
    </Button>
  )

  return (
    <div className='min-h-screen bg-gradient-to-b from-[#0f172a] to-[#1e293b] text-white py-8 px-4'>
      <div className='container mx-auto'>
        <div className='max-w-4xl mx-auto'>
          <div className="text-center mb-8">
            <h1 className='text-5xl font-bold mb-3 text-center bg-gradient-to-r from-orange-400 to-orange-600 bg-clip-text text-transparent'>
              AI Narration Studio
            </h1>
            <p className='text-xl text-center max-w-2xl mx-auto text-gray-300'>
              Create professional, natural-sounding narrations with advanced AI voices
            </p>
          </div>

          <div className="mb-6 flex rounded-lg overflow-hidden">
            <TabButton id="narration" label="Narration" icon={Mic} />
            <TabButton id="settings" label="Settings" icon={Settings} />
            <TabButton id="library" label="Library" icon={BookOpen} />
          </div>

          {activeTab === 'narration' && (
            <Card className='bg-[#1e293b]/80 border-[#334155] backdrop-blur-sm shadow-xl'>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className='text-3xl text-white flex items-center gap-3'>
                      <Mic className='w-8 h-8 text-orange-500' />
                      Voice Generator
                    </CardTitle>
                    <CardDescription className="text-gray-400 mt-2">
                      Transform your text into natural-sounding speech
                    </CardDescription>
                  </div>
                  {isConnected && (
                    <Badge className="bg-green-500 text-white">Connected</Badge>
                  )}
                </div>
              </CardHeader>

              <CardContent className='space-y-6'>
                <div className='grid grid-cols-1 md:grid-cols-2 gap-5'>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="voice-select" className="text-lg font-medium text-gray-300">
                        Voice
                      </Label>
                      <Select
                        value={selectedVoice}
                        onValueChange={setSelectedVoice}
                        disabled={isConverting}
                      >
                        <SelectTrigger id="voice-select" className='w-full bg-[#334155]/50 border-[#475569] text-white'>
                          <SelectValue placeholder='Select a voice' />
                        </SelectTrigger>
                        <SelectContent className='bg-[#1e293b] border-[#475569]'>
                          <SelectGroup>
                            <SelectLabel className="text-orange-400">Available Voices</SelectLabel>
                            {voicesData.default_voices.map((voice) => (
                              <SelectItem
                                key={voice.id}
                                value={voice.id}
                                className='text-white focus:bg-[#475569] focus:text-white'
                              >
                                {voice.voice} ({voice.accent}, {voice.gender}, {voice.age})
                              </SelectItem>
                            ))}
                          </SelectGroup>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label htmlFor='temperature-slider' className="text-lg font-medium text-gray-300">
                        Expressiveness: {temperature.toFixed(2)}
                      </Label>
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
                      <div className="flex justify-between text-xs text-gray-400 mt-1">
                        <span>Consistent</span>
                        <span>Expressive</span>
                      </div>
                    </div>

                    <div>
                      <Label htmlFor='speed-slider' className="text-lg font-medium text-gray-300">
                        Playback Speed: {speed.toFixed(1)}x
                      </Label>
                      <Slider
                        id='speed-slider'
                        min={0.5}
                        max={2}
                        step={0.1}
                        value={[speed]}
                        onValueChange={handleSpeedChange}
                        disabled={isConverting}
                        className='w-full'
                      />
                      <div className="flex justify-between text-xs text-gray-400 mt-1">
                        <span>Slower</span>
                        <span>Faster</span>
                      </div>
                    </div>
                  </div>

                  <div>
                    <Label
                      htmlFor='text-input'
                      className='text-lg font-medium text-gray-300 flex justify-between'
                    >
                      <span>Your Text</span>
                      <span className='text-sm text-gray-400'>
                        {text.length}/{MAX_TEXT_LENGTH} chars
                      </span>
                    </Label>
                    <Textarea
                      id='text-input'
                      placeholder='Enter text to convert to speech...'
                      value={text}
                      onChange={(e) => setText(e.target.value)}
                      className='h-[180px] bg-[#334155]/50 border-[#475569] text-white placeholder:text-gray-400 text-lg resize-none'
                      maxLength={MAX_TEXT_LENGTH}
                      disabled={isConverting}
                    />
                  </div>
                </div>

                {isConverting && processedTextLength > 0 && (
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm text-gray-400">
                      <span>Processing...</span>
                      <span>{Math.round((processedTextLength / text.length) * 100)}%</span>
                    </div>
                    <Progress value={(processedTextLength / text.length) * 100} className="h-2 bg-[#334155]" />
                  </div>
                )}

                <div className="flex gap-3">
                  <Button
                    onClick={generateSpeech}
                    disabled={isConverting || !text.trim() || !selectedVoice}
                    className='flex-1 bg-orange-500 hover:bg-orange-600 text-white text-lg py-6'
                  >
                    {isConverting ? (
                      <RefreshCw className='w-6 h-6 mr-2 animate-spin' />
                    ) : (
                      <Wand2 className='w-6 h-6 mr-2' />
                    )}
                    {isConverting ? 'Generating...' : 'Generate Narration'}
                  </Button>
                  
                  {audioRef.current?.src && !isConverting && (
                    <Button
                      onClick={handleSaveAudio}
                      className='bg-blue-600 hover:bg-blue-700 text-white'
                    >
                      <Save className="w-5 h-5" />
                    </Button>
                  )}
                </div>

                {error && (
                  <Alert variant="destructive" className="bg-red-500/20 border border-red-500 text-red-100">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertTitle>Error</AlertTitle>
                    <AlertDescription className="flex justify-between items-center">
                      {error}
                      <Button variant="ghost" size="sm" onClick={() => setError('')} className="text-red-100 hover:text-white">
                        <X className="h-4 w-4" />
                      </Button>
                    </AlertDescription>
                  </Alert>
                )}

                {/* Audio element always exists in DOM but is only visible when needed */}
                <div style={{ display: 'none' }}>
                  <audio
                    ref={audioRef}
                    controls
                    onError={(e) => {
                      console.error('Audio playback error:', e)
                      setError('Audio playback error')
                    }}
                  >
                    Your browser does not support the audio element.
                  </audio>
                </div>

                {(isConverting || (audioRef.current?.src && audioRef.current.src !== '')) && (
                  <Card className='bg-[#1e293b]/60 border-[#334155] mt-4'>
                    <CardHeader className="pb-2">
                      <CardTitle className='text-2xl text-white'>
                        {isConverting ? 'Generating Your Narration...' : 'Your Generated Narration'}
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="flex items-center justify-center">
                        {/* This is a clone of the audio element for display purposes */}
                        <audio
                          ref={(el) => setVisibleAudioRef(el)}
                          controls
                          src={audioRef.current?.src}
                          className='w-full'
                          onPlay={(e) => {
                            if (audioRef.current && !isPlaying) {
                              audioRef.current.currentTime = e.target.currentTime;
                              audioRef.current.play();
                              setIsPlaying(true);
                            }
                          }}
                          onPause={(e) => {
                            if (audioRef.current && isPlaying) {
                              audioRef.current.pause();
                              setIsPlaying(false);
                            }
                          }}
                          onTimeUpdate={(e) => {
                            // Keep the hidden audio in sync with this one
                            if (audioRef.current && Math.abs(audioRef.current.currentTime - e.target.currentTime) > 0.5) {
                              audioRef.current.currentTime = e.target.currentTime;
                            }
                          }}
                          onVolumeChange={(e) => {
                            if (audioRef.current) {
                              audioRef.current.volume = e.target.volume;
                              audioRef.current.muted = e.target.muted;
                              setIsMuted(e.target.muted);
                            }
                          }}
                          onRateChange={(e) => {
                            if (audioRef.current) {
                              const newRate = e.target.playbackRate;
                              audioRef.current.playbackRate = newRate;
                              setSpeed(newRate);
                            }
                          }}
                        >
                          Your browser does not support the audio element.
                        </audio>
                      </div>
                      
                      <div className="flex justify-center gap-3 mt-2">
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="text-white"
                          onClick={handleTogglePlayback}
                          disabled={isConverting || !audioRef.current?.src}
                        >
                          {isPlaying ? <PauseCircle className="h-5 w-5 mr-1" /> : <PlayCircle className="h-5 w-5 mr-1" />}
                          {isPlaying ? 'Pause' : 'Play'}
                        </Button>
                        
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-white"
                          onClick={handleToggleMute}
                          disabled={isConverting || !audioRef.current?.src}
                        >
                          {isMuted ? <VolumeX className="h-5 w-5 mr-1" /> : <Volume2 className="h-5 w-5 mr-1" />}
                          {isMuted ? 'Unmute' : 'Mute'}
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </CardContent>
            </Card>
          )}

          {activeTab === 'settings' && (
            <Card className='bg-[#1e293b]/80 border-[#334155] backdrop-blur-sm shadow-xl'>
              <CardHeader>
                <CardTitle className='text-3xl text-white flex items-center gap-3'>
                  <Settings className='w-8 h-8 text-orange-500' />
                  Settings
                </CardTitle>
                <CardDescription className="text-gray-400">
                  Configure your narration preferences
                </CardDescription>
              </CardHeader>
              <CardContent className='space-y-6'>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <h3 className="text-xl font-semibold text-white">Audio Settings</h3>
                    
                    <div className="space-y-2">
                      <Label htmlFor='default-speed' className="text-gray-300">
                        Default Playback Speed
                      </Label>
                      <Slider
                        id='default-speed'
                        min={0.5}
                        max={2}
                        step={0.1}
                        value={[speed]}
                        onValueChange={handleSpeedChange}
                        className='w-full'
                      />
                      <div className="text-right text-sm text-gray-400">{speed.toFixed(1)}x</div>
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    <h3 className="text-xl font-semibold text-white">Account & API</h3>
                    
                    <div className="space-y-2">
                      <Label htmlFor="token-status" className="text-gray-300">Token Status</Label>
                      <div id="token-status" className="p-3 rounded-md bg-[#334155]/50 border border-[#475569]">
                        <div className="flex justify-between">
                          <span>Status:</span>
                          <Badge className={isTokenValid() ? "bg-green-500" : "bg-red-500"}>
                            {isTokenValid() ? "Valid" : "Expired"}
                          </Badge>
                        </div>
                        {tokenData && (
                          <div className="text-sm text-gray-400 mt-2">
                            Expires: {new Date(tokenData.expiresAt).toLocaleString()}
                          </div>
                        )}
                      </div>
                    </div>
                    
                    <Button
                      onClick={fetchToken}
                      className="w-full mt-2 bg-blue-600 hover:bg-blue-700"
                    >
                      <RotateCcw className="w-4 h-4 mr-2" />
                      Refresh Token
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {activeTab === 'library' && (
            <Card className='bg-[#1e293b]/80 border-[#334155] backdrop-blur-sm shadow-xl'>
              <CardHeader>
                <CardTitle className='text-3xl text-white flex items-center gap-3'>
                  <BookOpen className='w-8 h-8 text-orange-500' />
                  Your Library
                </CardTitle>
                <CardDescription className="text-gray-400">
                  Browse and manage your saved narrations
                </CardDescription>
              </CardHeader>
              <CardContent>
                {savedAudios.length === 0 ? (
                  <div className="text-center py-12 text-gray-400">
                    <BookOpen className="w-16 h-16 mx-auto mb-4 opacity-50" />
                    <h3 className="text-xl font-medium">Your library is empty</h3>
                    <p className="mt-2">Save your narrations to access them here</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {savedAudios.map(audio => (
                      <Card key={audio.id} className="bg-[#334155]/50 border-[#475569]">
                        <CardContent className="pt-4">
                          <div className="flex flex-col sm:flex-row justify-between gap-3">
                            <div className="flex-1">
                              <h4 className="font-medium text-white line-clamp-1">{audio.text}</h4>
                              <div className="flex flex-wrap gap-2 mt-2">
                                <Badge variant="outline" className="text-orange-400 border-orange-400">
                                  {voicesData.default_voices.find(v => v.id === audio.voice)?.voice || audio.voice}
                                </Badge>
                                <Badge variant="outline" className="text-gray-300">
                                  {audio.date}
                                </Badge>
                              </div>
                            </div>
                            <div className="flex items-center">
                              <audio src={audio.src} controls className="w-full max-w-[250px]" />
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}
