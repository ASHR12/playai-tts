import { NextResponse } from 'next/server'
import { google } from 'googleapis'

const YOUTUBE_CATEGORY_MUSIC = '10'
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
    videoCategoryId: YOUTUBE_CATEGORY_MUSIC,
  })

  if (!response.data.items.length) {
    throw new Error('No video found')
  }

  const video = response.data.items[0]
  return {
    videoId: video.id.videoId,
    title: video.snippet.title,
  }
}

export async function POST(req) {
  try {
    const { query } = await req.json()
    
    if (!query) {
      return NextResponse.json(
        { error: 'Search query is required' },
        { status: 400 }
      )
    }

    const youtube = createYouTubeClient()
    const videoData = await searchVideo(youtube, query)
    
    return NextResponse.json(videoData)
  } catch (error) {
    console.error('YouTube API Error:', error)
    
    if (error.message === 'No video found') {
      return NextResponse.json(
        { error: error.message },
        { status: 404 }
      )
    }

    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    )
  }
}