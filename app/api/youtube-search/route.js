import { NextResponse } from 'next/server'
import { google } from 'googleapis'

// Configuration constants
const YOUTUBE_API_KEY = process.env.YOUTUBE_API_KEY
const MAX_RESULTS = 1
const YOUTUBE_PARTS = 'id,snippet'

function createYouTubeClient() {
  return google.youtube({
    version: 'v3',
    auth: YOUTUBE_API_KEY,
  })
}

async function searchVideo(youtube, query) {
  const response = await youtube.search.list({
    part: YOUTUBE_PARTS,
    q: query,
    type: 'video',
    maxResults: MAX_RESULTS,
  })
  const items = response.data?.items || []
  if (items.length === 0) {
    const error = new Error(`No video found for query "${query}"`)
    error.status = 404
    throw error
  }
  const {
    id: { videoId },
    snippet: { title },
  } = items[0]
  return { videoId, title }
}

export async function POST(request) {
  let body
  try {
    body = await request.json()
  } catch {
    return NextResponse.json(
      { status_message: 'Bad JSON body.' },
      { status: 400 }
    )
  }

  const { query } = body
  if (typeof query !== 'string' || !query.trim()) {
    return NextResponse.json(
      { status_message: 'The search query parameter provided was not valid or empty.' },
      { status: 400 }
    )
  }

  const youtube = createYouTubeClient()
  try {
    const result = await searchVideo(youtube, query.trim())
    return NextResponse.json(result)
  } catch (e) {
    const status = e.status || 500
    const message =
      status === 404
        ? e.message
        : 'An internal server error occurred during video search.'
    return NextResponse.json(
      { status_message: message },
      { status }
    )
  }
}
