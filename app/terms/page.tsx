import { Header } from '@/components/Header'

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <main className="container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto bg-white rounded-lg shadow-lg p-8">
          <h1 className="text-4xl font-bold mb-8">Terms of Service</h1>
          
          <div className="prose prose-gray max-w-none">
            <p className="text-gray-600 mb-6">Last updated: January 6, 2025</p>

            <h2 className="text-2xl font-bold mt-8 mb-4">1. Acceptance of Terms</h2>
            <p className="mb-4">
              By accessing and using NSAI Data ("Service"), you accept and agree to be bound by the terms and provision of this agreement.
            </p>

            <h2 className="text-2xl font-bold mt-8 mb-4">2. Use of Service</h2>
            <p className="mb-4">
              You may use our Service only for lawful purposes and in accordance with these Terms. You agree not to use our Service:
            </p>
            <ul className="list-disc list-inside mb-4 space-y-2">
              <li>In any way that violates any applicable federal, state, local, or international law</li>
              <li>To transmit any unauthorized advertising or promotional material</li>
              <li>To impersonate any person or entity</li>
              <li>In any way that infringes upon the rights of others</li>
            </ul>

            <h2 className="text-2xl font-bold mt-8 mb-4">3. Intellectual Property</h2>
            <p className="mb-4">
              The Service and its original content, features, and functionality are and will remain the exclusive property of NSAI Data and its licensors.
            </p>

            <h2 className="text-2xl font-bold mt-8 mb-4">4. Privacy Policy</h2>
            <p className="mb-4">
              Your use of our Service is also governed by our Privacy Policy. Please review our Privacy Policy, which also governs the Site and informs users of our data collection practices.
            </p>

            <h2 className="text-2xl font-bold mt-8 mb-4">5. API Usage</h2>
            <p className="mb-4">
              Access to our API is subject to rate limits based on your subscription plan. Excessive use may result in temporary or permanent suspension of access.
            </p>

            <h2 className="text-2xl font-bold mt-8 mb-4">6. Disclaimer</h2>
            <p className="mb-4">
              The information provided by NSAI Data is for general informational purposes only. While we strive to provide accurate information, we make no warranties about the completeness, reliability, or accuracy of this information.
            </p>

            <h2 className="text-2xl font-bold mt-8 mb-4">7. Limitation of Liability</h2>
            <p className="mb-4">
              In no event shall NSAI Data, nor its directors, employees, partners, agents, suppliers, or affiliates, be liable for any indirect, incidental, special, consequential, or punitive damages.
            </p>

            <h2 className="text-2xl font-bold mt-8 mb-4">8. Changes to Terms</h2>
            <p className="mb-4">
              We reserve the right to modify or replace these Terms at any time. If a revision is material, we will provide notice prior to any new terms taking effect.
            </p>

            <h2 className="text-2xl font-bold mt-8 mb-4">9. Contact Information</h2>
            <p className="mb-4">
              If you have any questions about these Terms, please contact us at:
              <br />
              Email: legal@nsaidata.com
            </p>
          </div>
        </div>
      </main>
    </div>
  )
}