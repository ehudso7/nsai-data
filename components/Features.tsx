export function Features() {
  const features = [
    {
      title: "Multi-Agent Intelligence",
      description: "Six specialized AI agents work together to analyze, search, extract, synthesize, format, and validate research.",
      icon: "🤖"
    },
    {
      title: "Lightning Fast",
      description: "Get comprehensive research reports in seconds, not hours. Average response time under 5 seconds.",
      icon: "⚡"
    },
    {
      title: "50+ Sources",
      description: "Analyze up to 50 sources per query, ensuring comprehensive coverage of any topic.",
      icon: "📚"
    },
    {
      title: "Fact-Checked",
      description: "Built-in validation agent cross-references claims and provides confidence scores.",
      icon: "✅"
    },
    {
      title: "Multiple Formats",
      description: "Export reports in Markdown, JSON, or HTML. Perfect for any use case.",
      icon: "📄"
    },
    {
      title: "API First",
      description: "RESTful API with SDKs for Python, JavaScript, and more. Integrate anywhere.",
      icon: "🔌"
    }
  ]

  return (
    <section id="features" className="py-20">
      <div className="container mx-auto px-4">
        <h2 className="text-4xl font-bold text-center mb-12">
          Why Choose NSAI Data?
        </h2>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <div key={index} className="bg-white p-6 rounded-xl shadow-lg hover:shadow-xl transition">
              <div className="text-4xl mb-4">{feature.icon}</div>
              <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
              <p className="text-gray-600">{feature.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}