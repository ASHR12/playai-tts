import { NextResponse } from 'next/server'
import { google } from 'googleapis'

const MAX_RESULTS = 1

const createYouTubeClient = () => {
  return google.youtube({
    version: 'v3',
    auth: process.env.YOUTUBE_API_KEY,
  })
}

const searchVideo = async (youtube, query) => {
  const response = await youtube.search.list({
    part: 'id,snippet',
    q: query,
    type: 'video',
    maxResults: MAX_RESULTS,
  })

  const items = response?.data?.items
  if (!items || items.length === 0) {
    console.warn(`No video found for query: "${query}"`)
    throw new Error('No video found')
  }

  const video = items[0]
  return {
    videoId: video.id.videoId,
    title: video.snippet.title,
  }
}

export async function POST(req) {
  try {
    const { query } = await req.json()

    if (!query || typeof query !== 'string' || query.trim() === '') {
      return NextResponse.json(
        { error: 'Invalid search query provided' },
        { status: 400 }
      )
    }

    const youtube = createYouTubeClient()
    const videoData = await searchVideo(youtube, query.trim())

    return NextResponse.json(videoData)
  } catch (error) {
    console.error(
      'API Route Error:',
      error instanceof Error ? error.message : error
    )

    if (error.message === 'No video found') {
      return NextResponse.json({ error: error.message }, { status: 404 })
    }

    // Check for potential Google API errors (example structure, might need adjustment)
    if (error.errors && error.errors.length > 0) {
      const apiError = error.errors[0]
      console.error(
        `Google API Error: ${apiError.reason} - ${apiError.message}`
      )
      // Provide a more specific error message if desired
      return NextResponse.json(
        { error: `Failed to search YouTube: ${apiError.reason}` },
        { status: 500 } // Or map specific reasons to status codes
      )
    }

    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    )
  }
}
