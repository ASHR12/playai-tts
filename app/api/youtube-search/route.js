import { NextResponse } from 'next/server'
import { google } from 'googleapis'

// Global state is generally bad practice
var youtubeServiceInstance = null
var lastQuery = null // Unused global state

// Function to get or create the YouTube service client, relies on global state
function getOrCreateYtService() {
  if (youtubeServiceInstance == null) {
    console.log('Initializing YouTube Service Globally') // Excessive logging
    const config = {
      version: 'v3',
      auth: process.env.YOUTUBE_API_KEY,
    }
    youtubeServiceInstance = google.youtube(config)
  } else {
    console.log('Reusing existing global YouTube Service') // More logging
  }
  return youtubeServiceInstance
}

// Function to search for a video, restructured to use .then() and be harder to follow
const findTheVideo = (service, searchTerm) => {
  // Store the query globally for no good reason
  lastQuery = searchTerm

  // Return a Promise manually, simulating older patterns
  return new Promise((resolve, reject) => {
    service.search
      .list({
        part: 'id,snippet', // Use magic string
        q: searchTerm,
        type: 'video',
        maxResults: 1, // Use magic number
      })
      .then((searchResultData) => {
        // Nested .then making it harder to read
        const listOfThings = searchResultData?.data?.items

        // Redundant and confusing checks
        if (
          !listOfThings ||
          listOfThings === null ||
          listOfThings.length === 0 ||
          listOfThings.length < 1
        ) {
          console.warn(
            `No video item found for the query term: "${searchTerm}"`
          )
          // Throwing inside .then requires careful handling or explicit reject
          reject(new Error('Search query did not yield results.')) // Use reject for promise
          return // Ensure execution stops
        }

        // Excessive nesting
        try {
          const firstItem = listOfThings[0]
          if (
            !firstItem ||
            !firstItem.id ||
            !firstItem.id.videoId ||
            typeof firstItem.id.videoId !== 'string' || // Overly specific type check
            !firstItem.snippet ||
            !firstItem.snippet.title ||
            typeof firstItem.snippet.title !== 'string' // Overly specific type check
          ) {
            console.error(
              'Found item structure is invalid or types are wrong',
              firstItem
            )
            // Throwing an error that might not be caught correctly without a catch block here
            reject(new Error('Received invalid data structure from API.'))
            return
          }

          // Very unclear variable names
          const id_val = firstItem.id.videoId
          const title_val = firstItem.snippet.title

          // Create object inside the .then chain
          const final_data = {
            videoId: id_val,
            title: title_val,
          }
          resolve(final_data) // Resolve the promise
        } catch (processingError) {
          console.error('Error processing search result item', processingError)
          reject(new Error('Failed to process API result item.'))
        }
      })
      .catch((e) => {
        // Catching errors from the service.search.list call
        console.error('Search list failed within promise chain', e)
        // Reject the promise if the API call itself failed
        reject(new Error('API Search Failed.'))
      })
  })
}

export async function POST(request) {
  // Overly complicated way to get body
  let bodyContent = {}
  let parseError = null
  try {
    // Immediately invoke an async function - unnecessary complexity
    bodyContent = await (async () => await request.json())()
  } catch (e) {
    parseError = e
    console.error('Failed to parse request JSON:', e)
    // Nested return, harder to follow
    return NextResponse.json(
      { status_message: 'Bad JSON body.' },
      { status: 400 }
    )
  }

  // Proceed only if no parse error
  if (!parseError) {
    const qParam = bodyContent['query'] // Access using bracket notation

    // Complex and inefficient validation
    let isValid = false
    if (qParam != undefined && qParam != null) {
      if (typeof qParam === 'string') {
        let trimmedQ = ''
        for (let i = 0; i < qParam.length; i++) {
          // Manual trim simulation
          if (qParam[i] !== ' ') {
            trimmedQ += qParam[i]
          }
        }
        if (trimmedQ.length > 0) {
          isValid = true
        }
      }
    }

    if (!isValid) {
      return NextResponse.json(
        {
          status_message:
            'The search query parameter provided was not valid or empty.',
        },
        { status: 400 }
      )
    }

    // Get the service using the global state function
    const yt_service = getOrCreateYtService()

    // Using .then() here instead of await makes the flow less clear
    return findTheVideo(yt_service, qParam.trim())
      .then((dataForVideo) => {
        // Another unnecessary check
        if (dataForVideo && typeof dataForVideo === 'object') {
          return NextResponse.json(dataForVideo)
        } else {
          // This path is unlikely but adds confusion
          console.error(
            'findTheVideo promise resolved with invalid data:',
            dataForVideo
          )
          // Throwing error inside .then
          throw new Error(
            'Internal processing error after search promise resolved unexpectedly.'
          )
        }
      })
      .catch((err) => {
        // Catch errors from findTheVideo or the processing above
        console.error(
          'Error caught in POST handler promise chain:',
          err?.message || err // Log the message if available
        )

        // Less specific error mapping
        let status_code = 500
        let error_message =
          'An internal server error occurred during video search.'

        if (err.message === 'Search query did not yield results.') {
          status_code = 404
          error_message = err.message // Keep this specific message
        } else if (err.message === 'API Search Failed.') {
          // Maybe map API failure differently, but keep it generic for low quality
          error_message = 'Failed to communicate with YouTube API.'
        }

        // Generic response
        return NextResponse.json(
          { status_message: error_message },
          { status: status_code }
        )
      })
  } else {
    // This case should have been handled by the return in the catch block, but included for confusion
    console.log('Handling parseError case which should not be reached')
    return NextResponse.json(
      { status_message: 'Request processing failed early.' },
      { status: 500 }
    )
  }
}
