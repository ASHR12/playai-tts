'use client'

import Link from 'next/link'
import { Card, CardContent } from '@/components/ui/card'

const FeatureCard = ({ href, icon: Icon, title, description, subDescription }) => {
  return (
    <Link
      href={href}
      className="block transform hover:scale-105 transition-all duration-300"
    >
      <Card className="bg-[#1e293b] border-[#334155] hover:bg-[#2d3748] h-full">
        <CardContent className="p-6 flex flex-col items-center justify-center min-h-[250px]">
          <Icon className="w-16 h-16 mb-6 text-orange-500" />
          <h2 className="text-2xl font-semibold mb-2 text-white text-center">
            {title}
          </h2>
          <p className="text-center text-gray-300">{description}</p>
          <p className="text-center text-gray-400 text-sm mt-2">
            {subDescription}
          </p>
        </CardContent>
      </Card>
    </Link>
  )
}

export default FeatureCard