import { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'メール確認 - Influencer Chat',
  description: 'メールアドレスの確認',
}

export default function VerifyPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            メールを確認してください
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            確認メールを送信しました。メール内のリンクをクリックして、アカウントを有効化してください。
          </p>
        </div>
        <div className="text-sm text-center">
          <Link
            href="/auth"
            className="font-medium text-blue-600 hover:text-blue-500"
          >
            ログインページに戻る
          </Link>
        </div>
      </div>
    </div>
  )
}
