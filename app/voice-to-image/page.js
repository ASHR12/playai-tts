'use client'

import React, { useEffect, useState, useCallback } from 'react'
import * as fal from '@fal-ai/serverless-client'
import { open as openEmbed } from '@play-ai/web-embed'
import { motion } from 'framer-motion'
import { toast } from 'sonner'

// Configure the fal proxy
fal.config({
  proxyUrl: '/api/fal/proxy',
})

export default function VoiceToArt() {
  const [image, setImage] = useState(null)
  const [isGenerating, setIsGenerating] = useState(false)

  const callFalAPI = useCallback(async (modelName, input) => {
    try {
      const result = await fal.subscribe(modelName, { input })
      if (result?.images?.length > 0) {
        setImage(result.images[0].url)
        return result.images[0].url
      }
      throw new Error('No image generated')
    } catch (error) {
      toast.error('Failed to generate image')
      console.error('FAL API Error:', error)
      return null
    }
  }, [])

  const generateImage = useCallback(
    async (prompt) => {
      if (!prompt?.trim()) {
        toast.error('Please provide a valid prompt')
        return
      }

      setIsGenerating(true)
      try {
        await callFalAPI('fal-ai/flux/schnell', { prompt })
        toast.success('Image generated successfully!')
      } catch (error) {
        console.error('Generation Error:', error)
      } finally {
        setIsGenerating(false)
      }
    },
    [callFalAPI]
  )

  const events = [
    {
      name: 'generate-image',
      when: 'the user wants to generate an image',
      data: {
        userPrompt: {
          type: 'string',
          description:
            "The user might provide a very basic prompt, and you must understand the intent and create a detailed prompt to generate a perfect image. Don't ask too many questions; whatever prompt the user provides, understand their intent and simply call the event generate-image",
        },
      },
    },
  ]

  const onEvent = useCallback(
    async (event) => {
      const { name, data } = event
      const { userPrompt } = data || {}

      if (!userPrompt) {
        toast.error('Invalid prompt received')
        return
      }

      switch (name) {
        case 'generate-image':
          await generateImage(userPrompt)
          break
        default:
          console.warn('Unknown event:', name)
      }
    },
    [generateImage]
  )

  const webEmbedId = process.env.NEXT_PUBLIC_WEB_EMBED_ID || ''

  useEffect(() => {
    if (!webEmbedId) {
      console.error('Web Embed ID is not configured')
      return
    }
    openEmbed(webEmbedId, { events, onEvent })
  }, [onEvent, webEmbedId])

  return (
    <div className='min-h-screen bg-[#1e293b] p-8'>
      <motion.h1
        className='text-4xl font-bold text-center text-orange-500 mb-8'
        initial={{ opacity: 0, y: -50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        Voice to Image : Play AI
      </motion.h1>
      <motion.p
        className='text-xl font-semibold text-center text-white mb-4'
        initial={{ opacity: 0, x: -50 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
      >
        Generate images using AI voice commands
      </motion.p>

      <div className='flex flex-col md:flex-row gap-8'>
        <div className='w-full md:w-1/2'>
          <motion.div
            className='border-2 border-[#334155] rounded-lg hover:bg-[#2d3748] h-[500px] flex items-center justify-center transition-colors'
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.6 }}
          >
            {isGenerating ? (
              <div className='flex flex-col items-center gap-4'>
                <div className='animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-orange-500'></div>
                <p className='text-white'>Generating image...</p>
              </div>
            ) : image ? (
              <img
                src={image}
                alt='Generated Art'
                className='max-w-full max-h-full object-contain rounded-lg'
              />
            ) : (
              <img
                src='/playcube.svg'
                alt='Placeholder'
                className='w-[300px] h-[300px] object-contain opacity-50'
              />
            )}
          </motion.div>
        </div>

        <div className='w-full md:w-1/2 flex items-center justify-center'>
          <div className='bg-[#2d3748] p-6 rounded-lg w-full max-w-md'>
            <h2 className='text-2xl font-semibold text-white mb-4'>
              Voice Commands
            </h2>
            <ul className='space-y-2 text-gray-300'>
              <li>
                • Say "generate an image of..." followed by your description
              </li>
              <li>• Be specific about what you want to see</li>
              <li>• Wait for the image to be generated</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}
