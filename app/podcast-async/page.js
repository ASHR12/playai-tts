'use client'
import { useState, useEffect } from 'react'
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
import AudioPlayer from '@/components/AudioPlayer'
import { RefreshCw, Wand2, Mic, Radio } from 'lucide-react'

const conversationStatusMessages = [
  'Crafting your podcast script...',
  'Brainstorming interesting topics...',
  'Writing engaging dialogue...',
  'Adding natural transitions...',
  'Polishing the conversation...',
  'Making it sound authentic...',
  'Adding personality to dialogue...',
  'Creating compelling content...',
  'Structuring the discussion...',
  'Finalizing the script...',
]

const audioStatusMessages = [
  'Brewing audio magic...',
  'Tuning the virtual microphones...',
  'Warming up the AI vocal cords...',
  'Channeling the spirit of podcasting...',
  'Crafting sonic brilliance...',
  'Mixing bytes and beats...',
  'Preparing for a digital broadcast...',
  'Syncing AI brainwaves...',
  'Generating auditory awesomeness...',
  'Harmonizing ones and zeros...',
]

function useStatusMessageCycle(messages, interval, isActive) {
  const [index, setIndex] = useState(0)

  useEffect(() => {
    if (!isActive) return

    const timer = setInterval(() => {
      setIndex((current) => (current + 1) % messages.length)
    }, interval)

    return () => clearInterval(timer)
  }, [messages, interval, isActive])

  return messages[index]
}

export default function PodcastCreator() {
  const [prompt, setPrompt] = useState('')
  const [conversation, setConversation] = useState('')
  const [selectedVoice1, setSelectedVoice1] = useState('')
  const [selectedVoice2, setSelectedVoice2] = useState('')
  const [isGenerating, setIsGenerating] = useState(false)
  const [audioUrl, setAudioUrl] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const conversationMessage = useStatusMessageCycle(
    conversationStatusMessages,
    2000,
    isGenerating
  )
  const audioMessage = useStatusMessageCycle(
    audioStatusMessages,
    4000,
    isLoading
  )

  const resetState = () => {
    setPrompt('')
    setConversation('')
    setSelectedVoice1('')
    setSelectedVoice2('')
    setAudioUrl('')
  }

  const generateConversation = async () => {
    try {
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
      toast.error('Failed to generate conversation')
      console.error(error)
    } finally {
      setIsGenerating(false)
    }
  }

  const generatePodcast = async () => {
    try {
      if (!selectedVoice1 || !selectedVoice2 || !conversation) {
        console.log('Validation failed:', {
          hasVoice1: !!selectedVoice1,
          hasVoice2: !!selectedVoice2,
          hasConversation: !!conversation,
        })
        toast.error(
          'Please select both voices and generate a conversation first'
        )
        return
      }

      setIsLoading(true)
      console.log('Sending request with:', {
        voice1: selectedVoice1,
        voice2: selectedVoice2,
        conversationLength: conversation.length,
      })

      const response = await fetch('/api/generate-podcast-async', {
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
        const errorData = await response.json()
        console.error('API error:', errorData)
        throw new Error(errorData.error || 'Failed to generate podcast')
      }

      const data = await response.json()
      console.log('Received audio URL:', data.audioUrl)
      setAudioUrl(data.audioUrl)
      toast.success('Podcast generated successfully!')
    } catch (error) {
      console.error('Error in generatePodcast:', error)
      toast.error(error.message || 'Failed to generate podcast')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className='min-h-screen bg-gradient-to-b from-[#0f172a] to-[#1e293b] text-white py-8'>
      <div className='container mx-auto p-6'>
        <div className='max-w-7xl mx-auto'>
          <h1 className='text-5xl font-bold mb-8 text-center text-orange-500'>
            AI Podcast Creator
          </h1>
          <p className='text-xl text-center mb-12 text-gray-300'>
            Create stunning podcasts with AI-powered voices
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
                  {isGenerating ? conversationMessage : 'Generate Conversation'}
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
                    disabled={!selectedVoice1 || !selectedVoice2 || isLoading}
                    className='w-full bg-orange-500 hover:bg-orange-600 text-white text-lg py-6'
                  >
                    {isLoading ? (
                      <RefreshCw className='w-6 h-6 mr-2 animate-spin' />
                    ) : (
                      <Radio className='w-6 h-6 mr-2' />
                    )}
                    {isLoading ? audioMessage : 'Generate Podcast'}
                  </Button>

                  {audioUrl && (
                    <Card className='bg-[#1e293b]/60 border-[#334155] mt-4'>
                      <CardHeader>
                        <CardTitle className='text-2xl text-white'>
                          Your Generated Podcast
                        </CardTitle>
                      </CardHeader>
                      <CardContent className='space-y-4'>
                        <AudioPlayer audioUrl={audioUrl} />
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
