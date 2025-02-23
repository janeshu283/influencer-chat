'use client'

import Link from 'next/link'
import Image from 'next/image'
import { GiftIcon, HeartIcon, ChatBubbleBottomCenterTextIcon } from '@heroicons/react/24/outline'

export default function Hero() {
  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center">
          <h1 className="text-4xl tracking-tight font-extrabold text-gray-900 sm:text-5xl md:text-6xl">
            <span className="block text-pink-600">GifTalk</span>
          </h1>
          <h2 className="mt-6 text-3xl font-bold text-gray-900">
            インフルエンサーと
            <br />
            チャットをしよう
          </h2>

          <div className="mt-12 max-w-lg mx-auto">
            <div className="relative w-full aspect-[4/3] overflow-hidden rounded-lg">
              <Image
                src="/images/hero-illustration.jpg"
                alt="インフルエンサーとチャット"
                fill
                style={{ objectFit: 'cover', objectPosition: 'center top' }}
                priority
                sizes="(max-width: 768px) 100vw, 800px"
                className="rounded-lg"
              />
            </div>
          </div>

          <div className="mt-16 grid grid-cols-3 gap-8 max-w-2xl mx-auto">
            <div className="text-center px-4 py-6 bg-white rounded-lg border-2 border-pink-200">
              <GiftIcon className="w-8 h-8 text-pink-500 mx-auto mb-2" />
              <h3 className="text-lg font-medium text-gray-900">
                ギフトを
                <br />
                受け取れる
              </h3>
            </div>
            <div className="text-center px-4 py-6 bg-white rounded-lg border-2 border-pink-200">
              <HeartIcon className="w-8 h-8 text-pink-500 mx-auto mb-2" />
              <h3 className="text-lg font-medium text-gray-900">
                ギフトを
                <br />
                送れる
              </h3>
            </div>
            <div className="text-center px-4 py-6 bg-white rounded-lg border-2 border-pink-200">
              <ChatBubbleBottomCenterTextIcon className="w-8 h-8 text-pink-500 mx-auto mb-2" />
              <h3 className="text-lg font-medium text-gray-900">
                返信率
                <br />
                <span className="text-pink-600 font-bold">99%</span>
              </h3>
            </div>
          </div>

          <div className="mt-12">
            <Link
              href="/auth"
              className="inline-flex items-center justify-center px-12 py-4 text-lg font-medium rounded-full text-white bg-pink-600 hover:bg-pink-700 transition-colors duration-200"
            >
              無料ではじめる
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
