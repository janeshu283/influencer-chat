import { Metadata } from 'next'
import Hero from '@/components/landing/Hero'

export const metadata: Metadata = {
  title: 'GifTalk - インフルエンサーとチャットをしよう',
  description: 'GifTalkはインフルエンサーとチャットができるプラットフォームです。',
}

export default function Home() {
  return <Hero />
}
