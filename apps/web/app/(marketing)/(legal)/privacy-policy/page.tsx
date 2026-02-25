import { SitePageHeader } from '~/(marketing)/_components/site-page-header';
import { createI18nServerInstance } from '~/lib/i18n/i18n.server';
import { withI18n } from '~/lib/i18n/with-i18n';

export async function generateMetadata() {
  const { t } = await createI18nServerInstance();

  return {
    title: t('marketing:privacyPolicy'),
  };
}

async function PrivacyPolicyPage() {
  const { t } = await createI18nServerInstance();

  return (
    <div>
      <SitePageHeader
        title={t('marketing:privacyPolicy')}
        subtitle={t('marketing:privacyPolicyDescription')}
      />

      <div className={'container mx-auto py-8 max-w-4xl'}>
        <div className="prose prose-gray dark:prose-invert max-w-none space-y-8">
          <p className="text-muted-foreground">
            Last updated: February 25, 2026
          </p>

          <section>
            <h2 className="text-2xl font-semibold">1. Introduction</h2>
            <p>
              ExecGPT Inc. (&quot;ExecGPT,&quot; &quot;we,&quot; &quot;us,&quot; or &quot;our&quot;) is committed to protecting your privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our AI-powered business intelligence platform.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold">2. Information We Collect</h2>
            <h3 className="text-xl font-medium mt-4">Information You Provide</h3>
            <ul className="list-disc pl-6 space-y-2">
              <li>Account information (name, email address, company name, job title)</li>
              <li>Billing and payment information (processed by our payment provider)</li>
              <li>Business data you connect to the Service (financial systems, CRM, HR platforms)</li>
              <li>Queries and prompts you submit through the Service</li>
              <li>Communications with our support team</li>
            </ul>

            <h3 className="text-xl font-medium mt-4">Information Collected Automatically</h3>
            <ul className="list-disc pl-6 space-y-2">
              <li>Device information (browser type, operating system, device identifiers)</li>
              <li>Usage data (features used, pages visited, session duration)</li>
              <li>Log data (IP address, access times, referring URLs)</li>
              <li>Cookies and similar tracking technologies (see our Cookie Policy)</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold">3. How We Use Your Information</h2>
            <p>We use the information we collect to:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Provide, operate, and maintain the Service</li>
              <li>Process your queries and deliver AI-generated insights</li>
              <li>Manage your account and process payments</li>
              <li>Improve and personalize the Service</li>
              <li>Send you service-related communications and updates</li>
              <li>Respond to your requests and support inquiries</li>
              <li>Detect, prevent, and address technical issues and security threats</li>
              <li>Comply with legal obligations</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold">4. Data Security</h2>
            <p>
              We implement industry-standard security measures to protect your data, including:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li>256-bit AES encryption for data at rest</li>
              <li>TLS 1.3 encryption for data in transit</li>
              <li>SOC 2 Type II compliance</li>
              <li>Regular security audits and penetration testing</li>
              <li>Role-based access controls and multi-factor authentication</li>
              <li>Isolated tenant environments with no cross-tenant data access</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold">5. Data Sharing and Disclosure</h2>
            <p>
              We do not sell your personal information. We may share your information only in the following circumstances:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li><strong>Service Providers:</strong> With trusted third-party vendors who assist in operating the Service (hosting, analytics, payment processing), under strict data protection agreements</li>
              <li><strong>Legal Requirements:</strong> When required by law, regulation, or legal process</li>
              <li><strong>Business Transfers:</strong> In connection with a merger, acquisition, or sale of assets</li>
              <li><strong>With Your Consent:</strong> When you explicitly authorize sharing</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold">6. Your Business Data</h2>
            <p>
              Business data you connect to ExecGPT remains your property. We process it solely to provide the Service. Your business data is:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Never used to train AI models</li>
              <li>Never shared with other customers</li>
              <li>Never sold to third parties</li>
              <li>Encrypted and isolated in your dedicated environment</li>
              <li>Deletable upon your request</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold">7. Data Retention</h2>
            <p>
              We retain your personal information for as long as your account is active or as needed to provide the Service. Upon account deletion, we will remove your data within 30 days, except where retention is required by law or for legitimate business purposes (e.g., fraud prevention).
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold">8. Your Rights</h2>
            <p>Depending on your jurisdiction, you may have the right to:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Access the personal information we hold about you</li>
              <li>Correct inaccurate or incomplete information</li>
              <li>Request deletion of your personal information</li>
              <li>Object to or restrict certain processing activities</li>
              <li>Request portability of your data</li>
              <li>Withdraw consent where processing is based on consent</li>
            </ul>
            <p className="mt-2">
              To exercise these rights, contact us at{' '}
              <a href="mailto:privacy@execgpt.com" className="text-primary underline">
                privacy@execgpt.com
              </a>.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold">9. International Data Transfers</h2>
            <p>
              Your information may be transferred to and processed in countries other than your own. We ensure appropriate safeguards are in place, including standard contractual clauses and compliance with applicable data protection frameworks.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold">10. Children&apos;s Privacy</h2>
            <p>
              The Service is not intended for individuals under 18 years of age. We do not knowingly collect personal information from children. If we learn we have collected information from a child, we will delete it promptly.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold">11. Changes to This Policy</h2>
            <p>
              We may update this Privacy Policy periodically. We will notify you of material changes via email or through the Service. The &quot;Last updated&quot; date at the top indicates when the policy was last revised.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold">12. Contact Us</h2>
            <p>
              For questions about this Privacy Policy or our data practices, contact us at:
            </p>
            <p className="mt-2">
              ExecGPT Inc.<br />
              Email:{' '}
              <a href="mailto:privacy@execgpt.com" className="text-primary underline">
                privacy@execgpt.com
              </a>
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}

export default withI18n(PrivacyPolicyPage);
