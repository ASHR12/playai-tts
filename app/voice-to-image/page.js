'use client'

import React, { useEffect, useState } from 'react'
import * as fal from '@fal-ai/serverless-client'
import { open as openEmbed } from '@play-ai/web-embed'
import { motion } from 'framer-motion'

// configure the fal proxy, see the full documentation here: https://fal.ai/docs/integrations/nextjs
fal.config({
  proxyUrl: '/api/fal/proxy',
})

// Global variable for image URL
let image_url = ''

export default function VoiceToArt() {
  const [image, setImage] = useState(null)
  async function callFalAPI(modelName, input) {
    const result = await fal.subscribe(modelName, { input })
    if (result?.images?.length > 0) {
      setImage(result.images[0].url)
      image_url = result.images[0].url
    }
  }

  //fal-ai/flux-pro/v1.1-ultra
  //fal-ai/flux/schnell
  async function generateImage(prompt) {
    await callFalAPI('fal-ai/flux/schnell', { prompt })
  }

  const events = [
    {
      name: 'generate-image',
      when: `the user wants to generate an image`,
      data: {
        userPrompt: {
          type: 'string',
          description:
            'The user might provide a very basic prompt, and you must understand the intent and create a detailed prompt to generate a perfect image. Don’t ask too many questions; whatever prompt the user provides, understand their intent and simply call the event generate-image',
        },
      },
    },
  ]

  const onEvent = async (event) => {
    console.log('event called', event)
    console.log('event type:', typeof event)
    console.log('event structure:', JSON.stringify(event, null, 2))
    const { name, data } = event
    const { userPrompt } = data
    if (!userPrompt) return
    switch (name) {
      case 'generate-image':
        await generateImage(userPrompt)
        break
    }
  }

  const webEmbedId = 'L7e8_Mv8CVorawFrXWoDW'

  useEffect(() => {
    openEmbed(webEmbedId, { events, onEvent })
  }, [])

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
        Image is created using flux schnell vai fal API (use can use any model
        as oer your need)
      </motion.p>

      <div className='flex justify-between'>
        <div className='w-1/2'>
          <motion.div
            className='border-[#334155] hover:bg-[#2d3748] h-[500px] flex items-center justify-center'
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.6 }}
          >
            {image ? (
              <img
                src={image}
                alt='Generated Art'
                className='max-w-full max-h-full object-contain'
              />
            ) : (
              <img
                src='/playcube.svg'
                alt='Placeholder'
                className='w-[300px] h-[300px] object-contain'
              />
            )}
          </motion.div>
        </div>

        <div className='w-1/2'></div>
      </div>
    </div>
  )
}
