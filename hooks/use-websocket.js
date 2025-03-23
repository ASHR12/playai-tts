'use client'

import { useRef, useCallback, useState } from 'react'

/**
 * Custom hook for WebSocket connection management
 */
export function useWebSocket({
  onChunkReceived,
  onComplete,
  onError,
  onProgress
}) {
  const [isConnected, setIsConnected] = useState(false)
  const wsRef = useRef(null)
  const reconnectAttempts = useRef(0)
  const conversionCompleted = useRef(false)

  // Connect to the WebSocket server
  const connect = useCallback(async (url, maxReconnectAttempts) => {
    if (wsRef.current) {
      disconnect()
    }

    reconnectAttempts.current = 0
    conversionCompleted.current = false

    return new Promise((resolve, reject) => {
      try {
        wsRef.current = new WebSocket(url)
        wsRef.current.binaryType = 'arraybuffer'

        wsRef.current.onopen = () => {
          console.log('WebSocket connection opened')
          setIsConnected(true)
          resolve(true)
        }

        wsRef.current.onmessage = async (event) => {
          if (event.data instanceof ArrayBuffer) {
            if (onChunkReceived) {
              await onChunkReceived(event.data)
            }
          } else {
            try {
              const message = JSON.parse(event.data)
              
              if (message.error) {
                if (onError) onError(message.error)
                throw new Error(message.error)
              }
              
              if (message.status === 'completed') {
                console.log('Conversion completed')
                conversionCompleted.current = true
                if (onComplete) onComplete()
              }
              
              if (message.progress && onProgress) {
                onProgress(message.progress)
              }
            } catch (e) {
              console.error('Message handling error:', e)
              if (onError) onError(e.message)
              disconnect()
            }
          }
        }

        wsRef.current.onerror = (error) => {
          console.error('WebSocket error:', error)
          if (onError) onError('Connection error occurred')
          setIsConnected(false)
          reject(error)
        }

        wsRef.current.onclose = async (event) => {
          console.log(`WebSocket closed with code ${event.code}`)
          setIsConnected(false)

          // If it's not a normal closure and conversion is not completed, attempt to reconnect
          if (event.code !== 1000 && !conversionCompleted.current) {
            if (reconnectAttempts.current < maxReconnectAttempts) {
              reconnectAttempts.current++
              console.log(`Attempting to reconnect (${reconnectAttempts.current}/${maxReconnectAttempts})`)
              
              // Wait a bit before reconnecting to avoid rapid reconnect attempts
              await new Promise(r => setTimeout(r, 1000))
              
              // Try to reconnect
              connect(url, maxReconnectAttempts)
                .then(resolve)
                .catch(reject)
            } else {
              if (onError) onError('Connection lost. Maximum reconnection attempts reached.')
              resolve(false) // Resolve but with false to indicate failure
            }
          }
        }
      } catch (error) {
        console.error('WebSocket connection error:', error)
        setIsConnected(false)
        reject(error)
      }
    })
  }, [onChunkReceived, onComplete, onError, onProgress])

  // Send message through the WebSocket
  const sendMessage = useCallback((message) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(message)
      return true
    }
    return false
  }, [])

  // Disconnect from the WebSocket server
  const disconnect = useCallback(() => {
    if (wsRef.current) {
      if (wsRef.current.readyState === WebSocket.OPEN) {
        wsRef.current.close()
      }
      wsRef.current = null
      setIsConnected(false)
    }
  }, [])

  return {
    connect,
    disconnect,
    sendMessage,
    isConnected
  }
}
