import AuthForm from '@/components/common/AuthForm'

export default function LoginPage() {
  return (
    <div className="max-w-md mx-auto py-8 px-4">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-gray-900">
          ログイン
        </h2>
        <p className="mt-2 text-sm text-gray-600">
          アカウントをお持ちでない場合は{' '}
          <a href="/auth" className="text-pink-600 hover:text-pink-700">
            新規登録
          </a>
        </p>
      </div>
      <AuthForm mode="login" />
    </div>
  )
}
