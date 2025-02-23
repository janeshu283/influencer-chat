import { Metadata } from 'next'
import SignupStepper from '@/components/auth/SignupStepper'

export const metadata: Metadata = {
  title: 'アカウント作成 - GifTalk',
  description: '新規アカウントの作成',
}

export default function SignUpPage() {
  return <SignupStepper />
}
