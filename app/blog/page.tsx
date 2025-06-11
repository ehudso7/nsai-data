import { Header } from '@/components/Header'
import Link from 'next/link'

export default function BlogPage() {
  const posts = [
    {
      id: 1,
      title: "Introducing NSAI Data: The Future of Autonomous Research",
      excerpt: "Today, we're excited to announce the launch of NSAI Data, a revolutionary platform that transforms how organizations conduct research...",
      date: "January 5, 2025",
      author: "Dr. Sarah Chen",
      readTime: "5 min read",
      category: "Product"
    },
    {
      id: 2,
      title: "How Multi-Agent AI Systems Outperform Traditional Search",
      excerpt: "Traditional search engines return links. NSAI Data returns answers. Learn how our six-agent system delivers comprehensive research in seconds...",
      date: "January 3, 2025",
      author: "Michael Rodriguez",
      readTime: "8 min read",
      category: "Technology"
    },
    {
      id: 3,
      title: "The Economics of AI-Powered Research: ROI Analysis",
      excerpt: "Organizations using NSAI Data report 90% time savings on research tasks. Here's a detailed breakdown of the economic benefits...",
      date: "December 28, 2024",
      author: "Emily Watson",
      readTime: "6 min read",
      category: "Business"
    },
    {
      id: 4,
      title: "Best Practices for Crafting Effective Research Queries",
      excerpt: "Get the most out of NSAI Data with these proven techniques for formulating research queries that yield comprehensive results...",
      date: "December 20, 2024",
      author: "Dr. James Liu",
      readTime: "4 min read",
      category: "Tutorial"
    }
  ]

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <main className="container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-4xl font-bold mb-4">Blog</h1>
          <p className="text-xl text-gray-600 mb-12">
            Insights, updates, and best practices from the NSAI Data team
          </p>
          
          <div className="space-y-8">
            {posts.map((post) => (
              <article key={post.id} className="bg-white rounded-lg shadow-lg p-8 hover:shadow-xl transition">
                <div className="flex items-center gap-4 mb-4">
                  <span className="bg-primary-100 text-primary-700 px-3 py-1 rounded-full text-sm font-medium">
                    {post.category}
                  </span>
                  <span className="text-gray-500 text-sm">{post.date}</span>
                  <span className="text-gray-500 text-sm">• {post.readTime}</span>
                </div>
                
                <h2 className="text-2xl font-bold mb-3 hover:text-primary-600 transition">
                  <Link href={`/blog/${post.id}`}>{post.title}</Link>
                </h2>
                
                <p className="text-gray-700 mb-4">{post.excerpt}</p>
                
                <div className="flex items-center justify-between">
                  <p className="text-sm text-gray-600">By {post.author}</p>
                  <Link 
                    href={`/blog/${post.id}`}
                    className="text-primary-600 hover:text-primary-700 font-medium flex items-center gap-2"
                  >
                    Read more 
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </Link>
                </div>
              </article>
            ))}
          </div>

          <div className="mt-12 bg-primary-50 rounded-lg p-8 text-center">
            <h2 className="text-2xl font-bold mb-4">Stay Updated</h2>
            <p className="text-gray-700 mb-6">
              Get the latest insights and product updates delivered to your inbox
            </p>
            <form className="max-w-md mx-auto flex gap-4">
              <input
                type="email"
                placeholder="Enter your email"
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                required
              />
              <button
                type="submit"
                className="bg-primary-600 text-white px-6 py-2 rounded-lg hover:bg-primary-700 transition"
              >
                Subscribe
              </button>
            </form>
          </div>
        </div>
      </main>
    </div>
  )
}