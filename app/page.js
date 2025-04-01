'use client'

import { Mic, Podcast, Radio, Image } from 'lucide-react'
import FeatureCard from '@/components/FeatureCard'

const features = [
  {
    href: '/voice-to-youtube',
    icon: (props) => (
      <svg
        xmlns='http://www.w3.org/2000/svg'
        viewBox='0 0 24 24'
        fill='none'
        stroke='currentColor'
        strokeWidth='2'
        strokeLinecap='round'
        strokeLinejoin='round'
        {...props}
      >
        <path d='M2.5 17a24.12 24.12 0 0 1 0-10 2 2 0 0 1 1.4-1.4 49.56 49.56 0 0 1 16.2 0A2 2 0 0 1 21.5 7a24.12 24.12 0 0 1 0 10 2 2 0 0 1-1.4 1.4 49.55 49.55 0 0 1-16.2 0A2 2 0 0 1 2.5 17' />
        <path d='m10 15 5-3-5-3z' />
      </svg>
    ),
    title: 'TalkTube',
    description: 'Search YouTube Videos',
    subDescription: 'Web Embed Example',
  },
  {
    href: '/voice-to-image',
    icon: Image,
    title: 'Voice-To-Image',
    description: 'Create image using Fal AI',
    subDescription: 'Web Embed Example',
  },
  {
    href: '/narration-ws',
    icon: Mic,
    title: 'Narration',
    description: 'Single-speaker',
    subDescription: 'Websocket Implementation',
  },
  {
    href: '/podcast-async',
    icon: Podcast,
    title: 'AI Podcast',
    description: 'Two Speakers',
    subDescription: 'Asynchronous Generation',
  },
  {
    href: '/podcast-stream',
    icon: Radio,
    title: 'AI Podcast',
    description: 'Two Speakers',
    subDescription: 'Streaming',
  },
]

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
          {features.map((feature, index) => (
            <FeatureCard
              key={index}
              href={feature.href}
              icon={feature.icon}
              title={feature.title}
              description={feature.description}
              subDescription={feature.subDescription}
            />
          ))}
        </div>
      </main>
    </div>
  )
}
