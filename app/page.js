'use client'

import {
  Mic,
  Users,
  BotIcon as Robot,
  Podcast,
  Radio,
  Image,
  Youtube,
} from 'lucide-react'
import FeatureCard from '@/components/FeatureCard'

const features = [
  {
    href: '/voice-to-youtube',
    icon: Youtube,
    title: 'Voice-To-YouTube',
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
