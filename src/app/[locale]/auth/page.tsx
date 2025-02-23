import { Metadata } from 'next'
import AuthForm from '@/components/auth/AuthForm'

export const metadata: Metadata = {
  title: 'ログイン - Influencer Chat',
  description: 'ログインまたはアカウント作成',
}

export default function AuthPage() {
  return <AuthForm mode="signin" />
}
