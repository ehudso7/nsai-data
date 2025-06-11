import { Header } from '@/components/Header'

export default function CareersPage() {
  const openings = [
    {
      title: "Senior Machine Learning Engineer",
      department: "Engineering",
      location: "San Francisco, CA / Remote",
      type: "Full-time",
      description: "Help build and scale our multi-agent AI system for autonomous research."
    },
    {
      title: "Backend Engineer - Distributed Systems",
      department: "Engineering",
      location: "San Francisco, CA / Remote",
      type: "Full-time",
      description: "Design and implement scalable infrastructure for real-time data processing."
    },
    {
      title: "Product Designer",
      department: "Design",
      location: "Remote",
      type: "Full-time",
      description: "Create intuitive interfaces for complex AI-powered research tools."
    },
    {
      title: "Developer Advocate",
      department: "Developer Relations",
      location: "Remote",
      type: "Full-time",
      description: "Help developers integrate NSAI Data's API into their applications."
    }
  ]

  const benefits = [
    "Competitive salary and equity",
    "100% remote work options",
    "Unlimited PTO policy",
    "Health, dental, and vision insurance",
    "$2,000 annual learning budget",
    "Latest equipment of your choice",
    "Annual company retreats",
    "Flexible working hours"
  ]

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <main className="container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-4xl font-bold mb-4">Join Our Team</h1>
          <p className="text-xl text-gray-600 mb-12">
            Help us build the future of AI-powered research
          </p>

          <div className="bg-white rounded-lg shadow-lg p-8 mb-8">
            <h2 className="text-2xl font-bold mb-4">Why NSAI Data?</h2>
            <p className="text-gray-700 mb-6">
              We're on a mission to democratize access to high-quality research. Our team is building 
              cutting-edge AI technology that helps millions of users make better decisions faster.
            </p>
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <h3 className="text-xl font-semibold mb-3">Impact</h3>
                <p className="text-gray-700">
                  Your work will directly impact how organizations worldwide conduct research and make decisions.
                </p>
              </div>
              <div>
                <h3 className="text-xl font-semibold mb-3">Innovation</h3>
                <p className="text-gray-700">
                  Work with state-of-the-art AI technology and contribute to groundbreaking research.
                </p>
              </div>
              <div>
                <h3 className="text-xl font-semibold mb-3">Growth</h3>
                <p className="text-gray-700">
                  Learn from industry experts and grow your career in a fast-paced startup environment.
                </p>
              </div>
              <div>
                <h3 className="text-xl font-semibold mb-3">Culture</h3>
                <p className="text-gray-700">
                  Join a diverse, inclusive team that values creativity, collaboration, and continuous learning.
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-lg p-8 mb-8">
            <h2 className="text-2xl font-bold mb-6">Benefits & Perks</h2>
            <div className="grid md:grid-cols-2 gap-4">
              {benefits.map((benefit, index) => (
                <div key={index} className="flex items-center gap-3">
                  <svg className="w-5 h-5 text-green-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="text-gray-700">{benefit}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-lg p-8 mb-8">
            <h2 className="text-2xl font-bold mb-6">Open Positions</h2>
            <div className="space-y-6">
              {openings.map((job, index) => (
                <div key={index} className="border-b pb-6 last:border-0">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="text-xl font-semibold">{job.title}</h3>
                    <span className="bg-primary-100 text-primary-700 px-3 py-1 rounded-full text-sm">
                      {job.type}
                    </span>
                  </div>
                  <p className="text-gray-600 mb-2">
                    {job.department} • {job.location}
                  </p>
                  <p className="text-gray-700 mb-4">{job.description}</p>
                  <button className="text-primary-600 hover:text-primary-700 font-medium">
                    View Details →
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-primary-50 rounded-lg p-8 text-center">
            <h2 className="text-2xl font-bold mb-4">Don't see the right role?</h2>
            <p className="text-gray-700 mb-6">
              We're always looking for talented people. Send us your resume and tell us how you can contribute.
            </p>
            <a 
              href="mailto:careers@nsaidata.com"
              className="inline-block bg-primary-600 text-white px-6 py-3 rounded-lg hover:bg-primary-700 transition"
            >
              Send Your Resume
            </a>
          </div>
        </div>
      </main>
    </div>
  )
}