import { NextResponse } from 'next/server'

export async function POST(request) {
  try {
    const response = await fetch('https://api.play.ai/api/v1/tts/auth', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.PLAY_AI_API_KEY}`,
        'X-User-Id': process.env.PLAY_AI_USER_ID,
        'Content-Type': 'application/json',
      },
    })

    const data = await response.json()
    console.log('Play.ai Response:', data)

    if (!response.ok) {
      return NextResponse.json(
        { error: data.message || 'Authentication failed' },
        { status: response.status }
      )
    }

    return NextResponse.json(data, { status: 200 })
  } catch (error) {
    console.error('Error:', error)
    return NextResponse.json(
      { error: 'Failed to get WebSocket URL' },
      { status: 500 }
    )
  }
}
