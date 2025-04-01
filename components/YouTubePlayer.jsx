'use client'

import React, { useEffect, useState } from 'react'
import * as fal from '@fal-ai/serverless-client'
import { open as openEmbed } from '@play-ai/web-embed'
import { motion } from 'framer-motion'

// Configure the fal proxy
fal.config({
  proxyUrl: '/api/fal/proxy',
})

export default function YouTubePlayer() {
  const [videoId, setVideoId] = useState('')
  const [videoTitle, setVideoTitle] = useState('')

  async function searchYouTube(query) {
    try {
      const response = await fetch('/api/youtube-search', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ query }),
      })
      const data = await response.json()
      if (data.videoId && data.title) {
        setVideoId(data.videoId)
        setVideoTitle(data.title)
      } else {
        console.error('No video found')
      }
    } catch (error) {
      console.error('Error searching YouTube:', error)
    }
  }

  const events = [
    {
      name: 'search-youtube',
      when: 'the user wants to search for a YouTube video',
      data: {
        userQuery: {
          type: 'string',
          description:
            "The user's search query for a YouTube video. Understand the intent and create a detailed search query if necessary.",
        },
      },
    },
  ]

  const onEvent = async (event) => {
    const { name, data } = event
    const { userQuery } = data
    if (!userQuery) return
    switch (name) {
      case 'search-youtube':
        await searchYouTube(userQuery)
        break
    }
  }

  useEffect(() => {
    const webEmbedId = process.env.NEXT_PUBLIC_WEB_EMBED_ID
    if (webEmbedId) {
      openEmbed(webEmbedId, { events, onEvent })
    } else {
      console.error('Web Embed ID is not set in environment variables')
    }
  }, [])

  return (
    <div className='min-h-screen bg-[#1e293b] p-4 md:p-8'>
      <motion.h1
        className='text-4xl font-bold text-center text-orange-500 mb-8'
        initial={{ opacity: 0, y: -50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        Voice to YouTube : Play AI
      </motion.h1>
      <motion.p
        className='text-xl font-semibold text-center text-white mb-4'
        initial={{ opacity: 0, x: -50 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
      >
        Search and play YouTube videos using voice commands
      </motion.p>

      <div className='max-w-7xl mx-auto mt-8'>
        <div className='flex flex-col md:flex-row gap-8 w-full'>
          <div className='w-full md:w-2/3'>
            {videoId ? (
              <div className='relative w-full pt-[56.25%]'>
                <iframe
                  className='absolute top-0 left-0 w-full h-full rounded-lg'
                  src={`https://www.youtube.com/embed/${videoId}?autoplay=1`}
                  allow='accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture'
                  allowFullScreen
                ></iframe>
              </div>
            ) : (
              <div className='relative w-full pt-[56.25%] bg-[#334155] rounded-lg'>
                <div className='absolute top-0 left-0 w-full h-full flex items-center justify-center'>
                  <img
                    src='/playcube.svg'
                    alt='Placeholder'
                    className='w-[200px] h-[200px] object-contain'
                  />
                </div>
              </div>
            )}
          </div>

          <div className='w-full md:w-1/3'>
            <h2 className='text-2xl font-bold text-white mb-4 break-words'>
              {videoTitle || 'No video selected'}
            </h2>
            <p className='text-gray-300'>
              Use voice commands to search for and play YouTube videos. Try
              saying "Play [song name]" or "Search for [video topic]".
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
