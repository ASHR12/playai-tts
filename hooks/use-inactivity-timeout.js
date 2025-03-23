'use client'

import { useRef, useCallback, useEffect } from 'react'

/**
 * Custom hook for managing inactivity timeout
 * @param {number} timeout - Timeout duration in milliseconds
 * @param {Function} onTimeout - Callback function to execute when timeout occurs
 */
export function useInactivityTimeout(timeout, onTimeout) {
  const timeoutRef = useRef(null)

  // Start the inactivity timeout
  const startInactivityTimeout = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }
    
    timeoutRef.current = setTimeout(() => {
      console.log('Inactivity timeout reached')
      if (onTimeout) {
        onTimeout()
      }
    }, timeout)
  }, [timeout, onTimeout])

  // Reset the inactivity timeout
  const resetInactivityTimeout = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }
    startInactivityTimeout()
  }, [startInactivityTimeout])

  // Initialize the timeout on component mount
  useEffect(() => {
    startInactivityTimeout()
    
    // Clean up on unmount
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
    }
  }, [startInactivityTimeout])

  return {
    startInactivityTimeout,
    resetInactivityTimeout
  }
}
