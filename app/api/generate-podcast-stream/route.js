// app/api/generate-podcast-stream/route.js
import { NextResponse } from 'next/server'

export async function POST(req) {
  console.log('[API] Starting podcast streaming process')

  try {
    const { voice1, voice2, conversation } = await req.json()
    console.log('[API] Received request with voices:', { voice1, voice2 })

    const headers = {
      'X-USER-ID': process.env.PLAY_AI_USER_ID,
      Authorization: `Bearer ${process.env.PLAY_AI_API_KEY}`,
      'Content-Type': 'application/json',
    }

    const payload = {
      model: 'PlayDialog',
      text: conversation,
      voice: voice1,
      voice2: voice2,
      turnPrefix: 'Speaker 1:',
      turnPrefix2: 'Speaker 2:',
      outputFormat: 'mp3',
      language: 'english',
    }

    console.log('[API] Sending request to Play.AI')
    const response = fetch('https://api.play.ai/api/v1/tts/stream', {
      method: 'POST',
      headers,
      body: JSON.stringify(payload),
    })

    console.log('[API] Play.AI response status:', response.status)
    if (!response.ok) {
      throw new Error(`API request failed: ${response.status}`)
    }

    // Stream the response
    const reader = response.body.getReader()
    const stream = new ReadableStream({
      async start(controller) {
        console.log('[API] Starting stream controller')
        try {
          while (true) {
            const { done, value } = await reader.read()
            if (done) {
              console.log('[API] Stream complete')
              controller.close()
              break
            }
            console.log('[API] Received chunk of size:', value.length)
            controller.enqueue(value)
          }
        } catch (error) {
          console.error('[API] Stream error:', error)
          controller.error(error)
        }
      },
    })

    return new Response(stream, {
      headers: {
        'Content-Type': 'audio/mpeg',
        'Transfer-Encoding': 'chunked',
      },
    })
  } catch (error) {
    console.error('[API] Error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to stream podcast' },
      { status: 500 }
    )
  }
}
