// app/api/generate-podcast/route.js
import { NextResponse } from 'next/server'

export async function POST(req) {
  console.log('Starting podcast generation process...')

  try {
    const { voice1, voice2, conversation } = await req.json()
    console.log('Received request payload:', {
      voice1,
      voice2,
      conversation: conversation.substring(0, 100) + '...',
    })

    // Input validation
    if (!voice1 || !voice2 || !conversation) {
      console.error('Missing required fields:', {
        voice1,
        voice2,
        hasConversation: !!conversation,
      })
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Validate environment variables
    if (!process.env.PLAY_AI_USER_ID || !process.env.PLAY_AI_API_KEY) {
      console.error('Missing environment variables')
      return NextResponse.json(
        { error: 'Server configuration error' },
        { status: 500 }
      )
    }

    const headers = {
      'X-USER-ID': process.env.PLAY_AI_USER_ID,
      Authorization: `Bearer ${process.env.PLAY_AI_API_KEY}`,
      'Content-Type': 'application/json',
    }

    console.log('Using headers:', {
      'X-USER-ID': process.env.PLAY_AI_USER_ID.substring(0, 5) + '...',
      Authorization:
        'Bearer ' + process.env.PLAY_AI_API_KEY.substring(0, 5) + '...',
    })

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

    console.log('Sending initial request to PlayDialog API...')
    const response = await fetch('https://api.play.ai/api/v1/tts/', {
      method: 'POST',
      headers,
      body: JSON.stringify(payload),
    })

    if (!response.ok) {
      const errorData = await response.text()
      console.error('Failed to initiate podcast generation:', {
        status: response.status,
        statusText: response.statusText,
        error: errorData,
      })
      throw new Error(
        `Failed to initiate podcast generation: ${response.status} ${response.statusText}`
      )
    }

    const responseData = await response.json()
    console.log('Received job ID:', responseData.id)

    const audioUrl = await pollForCompletion(responseData.id, headers)
    console.log('Successfully generated podcast:', audioUrl)

    return NextResponse.json({ audioUrl })
  } catch (error) {
    console.error('Error in podcast generation:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to generate podcast' },
      { status: 500 }
    )
  }
}

async function pollForCompletion(jobId, headers) {
  console.log('Starting polling for job:', jobId)
  const delayMs = 2000

  while (true) {
    console.log('Polling for job status...')

    try {
      const response = await fetch(`https://api.play.ai/api/v1/tts/${jobId}`, {
        headers,
      })

      if (!response.ok) {
        const errorData = await response.text()
        console.error('Failed to check status:', {
          status: response.status,
          error: errorData,
        })
        throw new Error('Failed to check podcast status')
      }

      const data = await response.json()
      const status = data.output?.status
      console.log('Current status:', status)

      if (status === 'COMPLETED') {
        console.log('Job completed successfully')
        return data.output.url
      } else if (status === 'FAILED') {
        throw new Error('Podcast generation failed on API side')
      }

      await new Promise((resolve) => setTimeout(resolve, delayMs))
    } catch (error) {
      console.error('Error during polling:', error)
      throw error
    }
  }
}
