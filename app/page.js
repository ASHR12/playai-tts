'use client'

import Link from 'next/link'
import { Card, CardContent } from '@/components/ui/card'
import { Mic, Users, BotIcon as Robot, Podcast, Radio } from 'lucide-react'

export default function Home() {
  return (
    <div className='min-h-screen bg-[#0f172a] text-white py-12'>
      <main className='container mx-auto p-4 max-w-5xl'>
        <h1 className='text-5xl font-bold mb-4 text-center text-orange-500'>
          Play.AI
        </h1>
        <p className='text-xl text-center mb-12 text-gray-300'>
          Seamless, natural conversations with voice AI.
        </p>
        <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8'>
          <Link
            href='/narration-ws'
            className='block transform hover:scale-105 transition-all duration-300'
          >
            <Card className='bg-[#1e293b] border-[#334155] hover:bg-[#2d3748] h-full'>
              <CardContent className='p-6 flex flex-col items-center justify-center min-h-[250px]'>
                <Mic className='w-16 h-16 mb-6 text-orange-500' />
                <h2 className='text-2xl font-semibold mb-2 text-white text-center'>
                  Narration
                </h2>
                <p className='text-center text-gray-300'>Single-speaker</p>
                <p className='text-center text-gray-400 text-sm mt-2'>
                  Websocket Implementation
                </p>
              </CardContent>
            </Card>
          </Link>

          <Link
            href='/podcast-async'
            className='block transform hover:scale-105 transition-all duration-300'
          >
            <Card className='bg-[#1e293b] border-[#334155] hover:bg-[#2d3748] h-full'>
              <CardContent className='p-6 flex flex-col items-center justify-center min-h-[250px]'>
                <Podcast className='w-16 h-16 mb-6 text-orange-500' />
                <h2 className='text-2xl font-semibold mb-2 text-white text-center'>
                  AI Podcast
                </h2>
                <p className='text-center text-gray-300'>Two Speakers</p>
                <p className='text-center text-gray-400 text-sm mt-2'>
                  Asynchronous Generation
                </p>
              </CardContent>
            </Card>
          </Link>

          <Link
            href='/podcast-stream'
            className='block transform hover:scale-105 transition-all duration-300'
          >
            <Card className='bg-[#1e293b] border-[#334155] hover:bg-[#2d3748] h-full'>
              <CardContent className='p-6 flex flex-col items-center justify-center min-h-[250px]'>
                <Radio className='w-16 h-16 mb-6 text-orange-500' />
                <h2 className='text-2xl font-semibold mb-2 text-white text-center'>
                  AI Podcast
                </h2>
                <p className='text-center text-gray-300'>Two Speakers</p>
                <p className='text-center text-gray-400 text-sm mt-2'>
                  Streaming
                </p>
              </CardContent>
            </Card>
          </Link>

          {/* <Link
            href='/agents'
            className='block transform hover:scale-105 transition-all duration-300'
          >
            <Card className='bg-[#1e293b] border-[#334155] hover:bg-[#2d3748] h-full'>
              <CardContent className='p-6 flex flex-col items-center justify-center min-h-[250px]'>
                <Robot className='w-16 h-16 mb-6 text-orange-500' />
                <h2 className='text-2xl font-semibold mb-2 text-white text-center'>
                  AI Voice Agents
                </h2>
                <p className='text-center text-gray-300'>Build your own</p>
                <p className='text-center text-gray-400 text-sm mt-2'>
                  Customizable AI Voices
                </p>
              </CardContent>
            </Card>
          </Link> */}
        </div>
      </main>
    </div>
  )
}
