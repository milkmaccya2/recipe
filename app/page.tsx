import { ImageUpload } from '@/components/features/image-upload'
import { Header } from '@/components/features/header'

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-red-50">
      <Header />
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6">
            Recipe Suggester AI
          </h1>
          <p className="text-xl text-gray-600 mb-12">
            食材の写真を撮って、AIが最適な献立を提案します
          </p>
          
          <ImageUpload />
          
          <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">📷</span>
              </div>
              <h3 className="text-lg font-semibold mb-2">写真を撮影</h3>
              <p className="text-gray-600">カメラで食材を撮影するか、ギャラリーから選択</p>
            </div>
            
            <div className="text-center">
              <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">🤖</span>
              </div>
              <h3 className="text-lg font-semibold mb-2">AI解析</h3>
              <p className="text-gray-600">AIが画像を解析して食材を自動認識</p>
            </div>
            
            <div className="text-center">
              <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">🍽️</span>
              </div>
              <h3 className="text-lg font-semibold mb-2">献立提案</h3>
              <p className="text-gray-600">認識した食材から最適なレシピを提案</p>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}