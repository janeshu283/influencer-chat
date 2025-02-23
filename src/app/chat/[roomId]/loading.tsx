export default function Loading() {
  return (
    <div className="flex flex-col h-screen relative">
      {/* ヘッダーのスケルトン */}
      <div className="sticky top-16 z-10 bg-white border-b shadow-sm">
        <div className="max-w-3xl mx-auto">
          <div className="flex items-center justify-between px-6 py-4">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 rounded-full bg-gray-200 animate-pulse" />
              <div>
                <div className="h-6 w-32 bg-gray-200 rounded animate-pulse" />
                <div className="h-4 w-20 bg-gray-200 rounded mt-2 animate-pulse" />
              </div>
            </div>
            <div className="h-10 w-32 bg-gray-200 rounded-full animate-pulse" />
          </div>
        </div>
      </div>

      {/* メッセージエリアのスケルトン */}
      <div className="flex-1 overflow-y-auto pt-20 px-4 pb-24 space-y-4 bg-gray-50">
        <div className="max-w-3xl mx-auto space-y-4">
          {[...Array(5)].map((_, i) => (
            <div
              key={i}
              className={`flex ${i % 2 === 0 ? 'justify-start' : 'justify-end'}`}
            >
              <div
                className={`max-w-xs sm:max-w-md h-12 rounded-lg animate-pulse ${
                  i % 2 === 0 ? 'bg-gray-200 w-48' : 'bg-pink-200 w-64'
                }`}
              />
            </div>
          ))}
        </div>
      </div>

      {/* メッセージ入力のスケルトン */}
      <div className="fixed bottom-16 left-0 right-0 bg-white border-t shadow-sm p-4 z-10">
        <div className="max-w-3xl mx-auto">
          <div className="flex space-x-3 px-4">
            <div className="flex-1 h-10 bg-gray-200 rounded-lg animate-pulse" />
            <div className="h-10 w-16 bg-gray-200 rounded-lg animate-pulse" />
          </div>
        </div>
      </div>
    </div>
  )
}
