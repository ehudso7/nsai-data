import { Header } from '@/components/Header'

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <main className="container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto bg-white rounded-lg shadow-lg p-8">
          <h1 className="text-4xl font-bold mb-8">Privacy Policy</h1>
          
          <div className="prose prose-gray max-w-none">
            <p className="text-gray-600 mb-6">Last updated: January 6, 2025</p>

            <h2 className="text-2xl font-bold mt-8 mb-4">1. Information We Collect</h2>
            <p className="mb-4">
              We collect information you provide directly to us, such as when you create an account, make a purchase, or contact us for support.
            </p>
            <ul className="list-disc list-inside mb-4 space-y-2">
              <li>Name and contact information</li>
              <li>Billing and payment information</li>
              <li>Research queries and usage data</li>
              <li>Communication preferences</li>
            </ul>

            <h2 className="text-2xl font-bold mt-8 mb-4">2. How We Use Your Information</h2>
            <p className="mb-4">We use the information we collect to:</p>
            <ul className="list-disc list-inside mb-4 space-y-2">
              <li>Provide, maintain, and improve our services</li>
              <li>Process transactions and send related information</li>
              <li>Send technical notices and support messages</li>
              <li>Respond to your comments and questions</li>
              <li>Monitor and analyze trends and usage</li>
            </ul>

            <h2 className="text-2xl font-bold mt-8 mb-4">3. Data Security</h2>
            <p className="mb-4">
              We implement appropriate technical and organizational measures to protect your personal information against unauthorized access, alteration, disclosure, or destruction.
            </p>

            <h2 className="text-2xl font-bold mt-8 mb-4">4. Data Retention</h2>
            <p className="mb-4">
              We retain your information for as long as necessary to provide you with our services and as described in this Privacy Policy. We may also retain and use your information to comply with legal obligations.
            </p>

            <h2 className="text-2xl font-bold mt-8 mb-4">5. Sharing of Information</h2>
            <p className="mb-4">
              We do not sell, trade, or rent your personal information to third parties. We may share your information in certain situations:
            </p>
            <ul className="list-disc list-inside mb-4 space-y-2">
              <li>With your consent</li>
              <li>To comply with legal obligations</li>
              <li>To protect rights and safety</li>
              <li>With service providers who assist in our operations</li>
            </ul>

            <h2 className="text-2xl font-bold mt-8 mb-4">6. Your Rights</h2>
            <p className="mb-4">You have the right to:</p>
            <ul className="list-disc list-inside mb-4 space-y-2">
              <li>Access your personal information</li>
              <li>Correct inaccurate data</li>
              <li>Request deletion of your data</li>
              <li>Object to processing of your data</li>
              <li>Data portability</li>
            </ul>

            <h2 className="text-2xl font-bold mt-8 mb-4">7. Cookies</h2>
            <p className="mb-4">
              We use cookies and similar tracking technologies to track activity on our service and hold certain information. You can instruct your browser to refuse all cookies or to indicate when a cookie is being sent.
            </p>

            <h2 className="text-2xl font-bold mt-8 mb-4">8. Changes to This Policy</h2>
            <p className="mb-4">
              We may update our Privacy Policy from time to time. We will notify you of any changes by posting the new Privacy Policy on this page and updating the "Last updated" date.
            </p>

            <h2 className="text-2xl font-bold mt-8 mb-4">9. Contact Us</h2>
            <p className="mb-4">
              If you have questions about this Privacy Policy, please contact us at:
              <br />
              Email: privacy@nsaidata.com
              <br />
              Address: NSAI Data, Inc., San Francisco, CA
            </p>
          </div>
        </div>
      </main>
    </div>
  )
}