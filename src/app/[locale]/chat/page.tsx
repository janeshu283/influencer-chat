import { Suspense } from 'react'
import ChatContainer from './ChatContainer'

export default function ChatPage() {
  return (
    <main className="flex-1 relative z-0 overflow-y-auto focus:outline-none">
      <div className="py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
          <h1 className="text-2xl font-semibold text-gray-900">チャット</h1>
        </div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
          <div className="py-4">
            <Suspense fallback={
              <div className="flex items-center justify-center min-h-[calc(100vh-200px)]">
                <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900"></div>
              </div>
            }>
              <ChatContainer />
            </Suspense>
          </div>
        </div>
      </div>
    </main>
  )
}
