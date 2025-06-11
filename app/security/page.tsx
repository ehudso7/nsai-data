import { Header } from '@/components/Header'

export default function SecurityPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <main className="container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-4xl font-bold mb-4">Security</h1>
          <p className="text-xl text-gray-600 mb-12">
            Your data security is our top priority
          </p>

          <div className="bg-white rounded-lg shadow-lg p-8 mb-8">
            <h2 className="text-2xl font-bold mb-4">Enterprise-Grade Security</h2>
            <p className="text-gray-700 mb-6">
              NSAI Data implements industry-leading security measures to protect your data and ensure 
              the confidentiality of your research queries.
            </p>
            
            <div className="grid md:grid-cols-2 gap-6">
              <div className="border rounded-lg p-6">
                <div className="text-3xl mb-3">🔐</div>
                <h3 className="text-lg font-semibold mb-2">End-to-End Encryption</h3>
                <p className="text-gray-600">
                  All data is encrypted in transit using TLS 1.3 and at rest using AES-256 encryption.
                </p>
              </div>
              <div className="border rounded-lg p-6">
                <div className="text-3xl mb-3">🛡️</div>
                <h3 className="text-lg font-semibold mb-2">SOC 2 Type II Certified</h3>
                <p className="text-gray-600">
                  Our infrastructure and processes are audited annually for security, availability, and confidentiality.
                </p>
              </div>
              <div className="border rounded-lg p-6">
                <div className="text-3xl mb-3">🔍</div>
                <h3 className="text-lg font-semibold mb-2">Regular Security Audits</h3>
                <p className="text-gray-600">
                  Third-party penetration testing and vulnerability assessments performed quarterly.
                </p>
              </div>
              <div className="border rounded-lg p-6">
                <div className="text-3xl mb-3">🌍</div>
                <h3 className="text-lg font-semibold mb-2">GDPR Compliant</h3>
                <p className="text-gray-600">
                  Full compliance with GDPR, CCPA, and other data protection regulations.
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-lg p-8 mb-8">
            <h2 className="text-2xl font-bold mb-6">Security Features</h2>
            <ul className="space-y-4">
              <li className="flex gap-3">
                <svg className="w-6 h-6 text-green-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <div>
                  <h3 className="font-semibold mb-1">Multi-Factor Authentication (MFA)</h3>
                  <p className="text-gray-600">Secure your account with TOTP-based two-factor authentication.</p>
                </div>
              </li>
              <li className="flex gap-3">
                <svg className="w-6 h-6 text-green-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <div>
                  <h3 className="font-semibold mb-1">API Key Management</h3>
                  <p className="text-gray-600">Rotate and manage API keys with granular permissions.</p>
                </div>
              </li>
              <li className="flex gap-3">
                <svg className="w-6 h-6 text-green-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <div>
                  <h3 className="font-semibold mb-1">Audit Logs</h3>
                  <p className="text-gray-600">Complete audit trail of all API access and account activities.</p>
                </div>
              </li>
              <li className="flex gap-3">
                <svg className="w-6 h-6 text-green-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <div>
                  <h3 className="font-semibold mb-1">IP Allowlisting</h3>
                  <p className="text-gray-600">Restrict API access to specific IP addresses or ranges.</p>
                </div>
              </li>
              <li className="flex gap-3">
                <svg className="w-6 h-6 text-green-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <div>
                  <h3 className="font-semibold mb-1">Data Isolation</h3>
                  <p className="text-gray-600">Your data is logically isolated from other customers.</p>
                </div>
              </li>
            </ul>
          </div>

          <div className="bg-white rounded-lg shadow-lg p-8 mb-8">
            <h2 className="text-2xl font-bold mb-4">Infrastructure Security</h2>
            <p className="text-gray-700 mb-6">
              Our infrastructure is built on industry-leading cloud providers with best-in-class security:
            </p>
            <ul className="list-disc list-inside space-y-2 text-gray-700">
              <li>Hosted on AWS with VPC isolation</li>
              <li>DDoS protection via CloudFlare</li>
              <li>Web Application Firewall (WAF) enabled</li>
              <li>Regular automated backups with point-in-time recovery</li>
              <li>Disaster recovery plan with &lt;4 hour RTO</li>
            </ul>
          </div>

          <div className="bg-white rounded-lg shadow-lg p-8">
            <h2 className="text-2xl font-bold mb-4">Report a Security Issue</h2>
            <p className="text-gray-700 mb-4">
              We take security vulnerabilities seriously. If you discover a security issue, 
              please report it to our security team immediately.
            </p>
            <a 
              href="mailto:security@nsaidata.com" 
              className="inline-block bg-red-600 text-white px-6 py-3 rounded-lg hover:bg-red-700 transition"
            >
              Report Security Issue
            </a>
            <p className="text-sm text-gray-600 mt-4">
              We aim to respond to all security reports within 24 hours.
            </p>
          </div>
        </div>
      </main>
    </div>
  )
}