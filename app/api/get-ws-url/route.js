/**
 * API endpoint to generate WebSocket connection URL with authentication token
 * @route GET /api/get-ws-url
 * @returns {Object} Contains WebSocket URL and authentication token
 */

import { NextResponse } from 'next/server';

export async function GET() {
  try {
    // Generate secure authentication token
    const token = crypto.randomUUID();

    // Configure WebSocket URL based on environment
    const wsUrl = process.env.NODE_ENV === 'production'
      ? 'wss://your-production-url.com'
      : 'ws://localhost:3000';

    // Return WebSocket connection details
    return NextResponse.json({
      url: wsUrl,
      token: token
    });
  } catch (error) {
    // Handle potential errors during URL/token generation
    console.error('WebSocket URL generation error:', error);
    return NextResponse.json(
      { error: 'Failed to generate WebSocket URL' },
      { status: 500 }
    );
  }
}
