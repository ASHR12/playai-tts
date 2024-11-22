'use client'

import Link from 'next/link'
import { Card, CardContent } from '@/components/ui/card'
import { Mic, Users, BotIcon as Robot } from 'lucide-react'

export default function Home() {
  return (
    <div className='min-h-screen bg-[#0f172a] text-white py-8'>
      <main className='container mx-auto p-4 max-w-4xl'>
        <h1 className='text-4xl font-bold mb-8 text-center'>Play.ai Demo</h1>
        <p className='text-xl text-center mb-12 text-gray-300'>
          Explore the power of AI-driven audio generation
        </p>

        <div className='grid grid-cols-1 md:grid-cols-3 gap-6'>
          <Link href='/narration' className='block'>
            <Card className='bg-[#1e293b] border-[#334155] hover:bg-[#2d3748] transition-colors duration-300'>
              <CardContent className='p-6 flex flex-col items-center justify-center h-full min-h-[200px]'>
                <Mic className='w-12 h-12 mb-4 text-orange-500' />
                <h2 className='text-xl font-semibold mb-2'>Narration</h2>
                <p className='text-center text-gray-300'>
                  Generate single-speaker narrations
                </p>
              </CardContent>
            </Card>
          </Link>

          <Link href='/conversation' className='block'>
            <Card className='bg-[#1e293b] border-[#334155] hover:bg-[#2d3748] transition-colors duration-300'>
              <CardContent className='p-6 flex flex-col items-center justify-center h-full min-h-[200px]'>
                <Users className='w-12 h-12 mb-4 text-orange-500' />
                <h2 className='text-xl font-semibold mb-2'>Conversation</h2>
                <p className='text-center text-gray-300'>
                  Create dynamic two-speaker dialogues
                </p>
              </CardContent>
            </Card>
          </Link>

          <Link href='/agents' className='block'>
            <Card className='bg-[#1e293b] border-[#334155] hover:bg-[#2d3748] transition-colors duration-300'>
              <CardContent className='p-6 flex flex-col items-center justify-center h-full min-h-[200px]'>
                <Robot className='w-12 h-12 mb-4 text-orange-500' />
                <h2 className='text-xl font-semibold mb-2'>Agents</h2>
                <p className='text-center text-gray-300'>
                  Explore AI-powered conversational agents
                </p>
              </CardContent>
            </Card>
          </Link>
        </div>

        <footer className='mt-16 text-center text-gray-400'>
          <p>&copy; 2023 Play.ai Demo. All rights reserved.</p>
        </footer>
      </main>
    </div>
  )
}
