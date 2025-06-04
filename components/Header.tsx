export function Header({ onLogoClick }: { onLogoClick?: () => void }) {
  return (
    <header className="bg-white shadow-sm border-b">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center">
            <button
              onClick={onLogoClick}
              className="text-2xl font-bold bg-gradient-to-r from-primary-600 to-purple-600 bg-clip-text text-transparent"
            >
              NSAI Data
            </button>
          </div>
          <nav className="hidden md:flex space-x-8">
            <a href="#features" className="text-gray-700 hover:text-primary-600">Features</a>
            <a href="#pricing" className="text-gray-700 hover:text-primary-600">Pricing</a>
            <a href="/docs" className="text-gray-700 hover:text-primary-600">Docs</a>
            <a href="/api" className="text-gray-700 hover:text-primary-600">API</a>
          </nav>
          <div className="flex items-center space-x-4">
            <button className="text-gray-700 hover:text-primary-600">Sign In</button>
            <button className="bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700">
              Get Started
            </button>
          </div>
        </div>
      </div>
    </header>
  )
}