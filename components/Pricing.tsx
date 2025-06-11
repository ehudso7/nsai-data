'use client'

import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'

export function Pricing() {
  const router = useRouter()
  const { data: session } = useSession()
  const plans = [
    {
      name: "Free",
      price: "$0",
      period: "forever",
      features: [
        "10 queries per month",
        "Basic features",
        "Community support",
        "API access"
      ],
      cta: "Start Free",
      highlighted: false
    },
    {
      name: "Starter",
      price: "$29",
      period: "per month",
      features: [
        "100 queries per month",
        "All features",
        "Email support",
        "Priority processing",
        "Export to all formats"
      ],
      cta: "Start Trial",
      highlighted: true
    },
    {
      name: "Professional",
      price: "$99",
      period: "per month",
      features: [
        "1,000 queries per month",
        "Custom integrations",
        "Priority support",
        "Advanced analytics",
        "Team collaboration"
      ],
      cta: "Start Trial",
      highlighted: false
    },
    {
      name: "Enterprise",
      price: "Custom",
      period: "contact us",
      features: [
        "Unlimited queries",
        "SLA guarantee",
        "Dedicated support",
        "On-premise option",
        "Custom AI training"
      ],
      cta: "Contact Sales",
      highlighted: false
    }
  ]

  return (
    <section id="pricing" className="py-20 bg-gray-50">
      <div className="container mx-auto px-4">
        <h2 className="text-4xl font-bold text-center mb-4">
          Simple, Transparent Pricing
        </h2>
        <p className="text-xl text-gray-600 text-center mb-12">
          Start free, scale as you grow
        </p>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 max-w-6xl mx-auto">
          {plans.map((plan, index) => (
            <div
              key={index}
              className={`bg-white rounded-xl p-6 ${
                plan.highlighted
                  ? 'shadow-2xl ring-2 ring-primary-500 transform scale-105'
                  : 'shadow-lg'
              }`}
            >
              {plan.highlighted && (
                <div className="bg-primary-500 text-white text-sm font-semibold px-3 py-1 rounded-full inline-block mb-4">
                  Most Popular
                </div>
              )}
              <h3 className="text-2xl font-bold mb-2">{plan.name}</h3>
              <div className="mb-4">
                <span className="text-4xl font-bold">{plan.price}</span>
                <span className="text-gray-600">/{plan.period}</span>
              </div>
              <ul className="space-y-3 mb-6">
                {plan.features.map((feature, i) => (
                  <li key={i} className="flex items-start">
                    <svg className="w-5 h-5 text-green-500 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span className="text-gray-700">{feature}</span>
                  </li>
                ))}
              </ul>
              <button
                onClick={() => {
                  if (plan.name === 'Enterprise') {
                    window.location.href = 'mailto:sales@nsaidata.com?subject=Enterprise Plan Inquiry'
                  } else {
                    router.push(session ? '/dashboard' : '/register')
                  }
                }}
                className={`w-full py-3 rounded-lg font-semibold transition ${
                  plan.highlighted
                    ? 'bg-primary-600 text-white hover:bg-primary-700'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {plan.cta}
              </button>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}