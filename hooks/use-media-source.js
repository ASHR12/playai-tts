'use client'

import { useRef, useCallback, useEffect } from 'react'

/**
 * Custom hook for handling MediaSource functionality
 * Manages audio playback and buffer processing
 */
export function useMediaSource({ onPlayStateChange, speed = 1.0 }) {
  const audioRef = useRef(null)
  const mediaSourceRef = useRef(null)
  const sourceBufferRef = useRef(null)
  const bufferQueue = useRef([])

  // Initialize the MediaSource and connect it to the audio element
  const initializeMediaSource = useCallback(() => {
    return new Promise((resolve, reject) => {
      // Wait for the next tick to ensure audioRef is attached
      setTimeout(() => {
        try {
          // Clean up any existing instance first
          resetAudio()

          // Create new MediaSource
          mediaSourceRef.current = new MediaSource()
          if (!audioRef.current) {
            console.error('Audio element ref is not available. Make sure it is attached to an audio element.');
            reject(new Error('Audio element not available'));
            return;
          }

          audioRef.current.src = URL.createObjectURL(mediaSourceRef.current)
          
          // Set playback rate from props
          audioRef.current.playbackRate = speed

          // Add play/pause state change listeners
          if (onPlayStateChange) {
            audioRef.current.addEventListener('play', () => onPlayStateChange(true))
            audioRef.current.addEventListener('pause', () => onPlayStateChange(false))
          }

          // Handle source open event
          mediaSourceRef.current.addEventListener('sourceopen', () => {
            try {
              const mimeType = 'audio/mpeg'
              if (!MediaSource.isTypeSupported(mimeType)) {
                throw new Error('Unsupported MIME type for audio')
              }

              sourceBufferRef.current = mediaSourceRef.current.addSourceBuffer(mimeType)
              sourceBufferRef.current.mode = 'sequence'
              
              // Process buffer when updates end
              sourceBufferRef.current.addEventListener('updateend', () => {
                if (!sourceBufferRef.current.updating && bufferQueue.current.length > 0) {
                  processBufferQueue()
                }
              })

              resolve()
            } catch (e) {
              reject(new Error('Failed to initialize audio source buffer: ' + e.message))
            }
          }, { once: true })
        } catch (error) {
          reject(new Error('Error initializing MediaSource: ' + error.message))
        }
      }, 0);
    })
  }, [speed, onPlayStateChange])

  // Process the next item in the buffer queue
  const processBufferQueue = useCallback(() => {
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
      
      // Handle quota exceeded error
      if (error.name === 'QuotaExceededError' && sourceBufferRef.current && !sourceBufferRef.current.updating) {
        // Remove first half of the buffer when quota exceeded
        sourceBufferRef.current.remove(0, sourceBufferRef.current.buffered.end(0) / 2)
        // Put the chunk back at the start of the queue
        bufferQueue.current.unshift(chunk)
      }
    }
  }, [])

  // Handle incoming audio chunks
  const processAudioChunk = useCallback(async (arrayBuffer) => {
    const chunk = new Uint8Array(arrayBuffer)
    
    if (chunk.length > 0) {
      // Add chunk to the queue
      bufferQueue.current.push(chunk)
      
      // Process if not currently updating
      if (sourceBufferRef.current && !sourceBufferRef.current.updating) {
        processBufferQueue()
      }

      // Auto-play when we receive data
      if (audioRef.current?.paused) {
        try {
          await audioRef.current.play()
        } catch (e) {
          console.error('Playback error:', e)
        }
      }
    }
  }, [processBufferQueue])

  // End the media stream
  const endMediaStream = useCallback(() => {
    if (mediaSourceRef.current?.readyState === 'open') {
      mediaSourceRef.current.endOfStream()
    }
  }, [])

  // Reset all audio-related state
  const resetAudio = useCallback(() => {
    if (mediaSourceRef.current?.readyState === 'open') {
      try {
        mediaSourceRef.current.endOfStream()
      } catch (error) {
        console.warn('Error ending media stream:', error)
      }
    }

    if (audioRef.current) {
      try {
        audioRef.current.pause()
        if (audioRef.current.src) {
          URL.revokeObjectURL(audioRef.current.src)
        }
        audioRef.current.removeAttribute('src')
        audioRef.current.load()
      } catch (error) {
        console.warn('Error resetting audio element:', error)
      }
    }

    bufferQueue.current = []
    sourceBufferRef.current = null
    mediaSourceRef.current = null
  }, [])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      resetAudio()
    }
  }, [resetAudio])

  // Make sure audio element is created early to avoid initialization issues
  useEffect(() => {
    // This ensures we have a safety check when the hook first mounts
    // but doesn't affect the component if it already has an audio element
    if (!audioRef.current) {
      console.log('Audio ref initialized through effect')
    }
  }, [])

  return {
    audioRef,
    initializeMediaSource,
    processAudioChunk,
    endMediaStream,
    resetAudio
  }
}
