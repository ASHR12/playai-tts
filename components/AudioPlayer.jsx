'use client'

import React, { useEffect, useRef } from 'react'
import { toast } from 'sonner'

// Change the export to default
export default function AudioPlayer({ audioUrl }) {
  const audioRef = useRef(null)

  useEffect(() => {
    if (audioUrl && audioRef.current) {
      audioRef.current.src = audioUrl
      audioRef.current.load()
      audioRef.current.play().catch((error) => {
        console.error('Audio playback failed:', error)
        toast.error(
          'Failed to play audio automatically. Please try playing manually.'
        )
      })
    }
  }, [audioUrl])

  return (
    <audio ref={audioRef} controls className='w-full'>
      Your browser does not support the audio element.
    </audio>
  )
}
