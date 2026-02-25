import { SitePageHeader } from '~/(marketing)/_components/site-page-header';
import { createI18nServerInstance } from '~/lib/i18n/i18n.server';
import { withI18n } from '~/lib/i18n/with-i18n';

export async function generateMetadata() {
  const { t } = await createI18nServerInstance();

  return {
    title: t('marketing:cookiePolicy'),
  };
}

async function CookiePolicyPage() {
  const { t } = await createI18nServerInstance();

  return (
    <div>
      <SitePageHeader
        title={t(`marketing:cookiePolicy`)}
        subtitle={t(`marketing:cookiePolicyDescription`)}
      />

      <div className={'container mx-auto py-8 max-w-4xl'}>
        <div className="prose prose-gray dark:prose-invert max-w-none space-y-8">
          <p className="text-muted-foreground">
            Last updated: February 25, 2026
          </p>

          <section>
            <h2 className="text-2xl font-semibold">1. What Are Cookies</h2>
            <p>
              Cookies are small text files stored on your device when you visit a website. They help websites remember your preferences, understand how you use the site, and improve your experience. ExecGPT uses cookies and similar technologies to operate and improve our Service.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold">2. How ExecGPT Uses Cookies</h2>
            <p>We use the following types of cookies:</p>

            <h3 className="text-xl font-medium mt-4">Essential Cookies</h3>
            <p>
              These cookies are necessary for the Service to function properly. They enable core features such as authentication, session management, and security. You cannot opt out of essential cookies as the Service will not work without them.
            </p>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse border border-border text-sm">
                <thead>
                  <tr className="bg-muted">
                    <th className="border border-border px-4 py-2 text-left">Cookie</th>
                    <th className="border border-border px-4 py-2 text-left">Purpose</th>
                    <th className="border border-border px-4 py-2 text-left">Duration</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="border border-border px-4 py-2">session_token</td>
                    <td className="border border-border px-4 py-2">Maintains your authenticated session</td>
                    <td className="border border-border px-4 py-2">Session</td>
                  </tr>
                  <tr>
                    <td className="border border-border px-4 py-2">csrf_token</td>
                    <td className="border border-border px-4 py-2">Protects against cross-site request forgery</td>
                    <td className="border border-border px-4 py-2">Session</td>
                  </tr>
                  <tr>
                    <td className="border border-border px-4 py-2">cookie_consent</td>
                    <td className="border border-border px-4 py-2">Stores your cookie preferences</td>
                    <td className="border border-border px-4 py-2">1 year</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <h3 className="text-xl font-medium mt-4">Analytics Cookies</h3>
            <p>
              These cookies help us understand how visitors interact with the Service by collecting anonymous usage data. This information helps us improve the user experience.
            </p>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse border border-border text-sm">
                <thead>
                  <tr className="bg-muted">
                    <th className="border border-border px-4 py-2 text-left">Cookie</th>
                    <th className="border border-border px-4 py-2 text-left">Purpose</th>
                    <th className="border border-border px-4 py-2 text-left">Duration</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="border border-border px-4 py-2">_ga</td>
                    <td className="border border-border px-4 py-2">Google Analytics - distinguishes users</td>
                    <td className="border border-border px-4 py-2">2 years</td>
                  </tr>
                  <tr>
                    <td className="border border-border px-4 py-2">_ga_*</td>
                    <td className="border border-border px-4 py-2">Google Analytics - maintains session state</td>
                    <td className="border border-border px-4 py-2">2 years</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <h3 className="text-xl font-medium mt-4">Functional Cookies</h3>
            <p>
              These cookies enable enhanced features and personalization, such as remembering your display preferences and language settings.
            </p>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse border border-border text-sm">
                <thead>
                  <tr className="bg-muted">
                    <th className="border border-border px-4 py-2 text-left">Cookie</th>
                    <th className="border border-border px-4 py-2 text-left">Purpose</th>
                    <th className="border border-border px-4 py-2 text-left">Duration</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="border border-border px-4 py-2">theme</td>
                    <td className="border border-border px-4 py-2">Stores your light/dark mode preference</td>
                    <td className="border border-border px-4 py-2">1 year</td>
                  </tr>
                  <tr>
                    <td className="border border-border px-4 py-2">locale</td>
                    <td className="border border-border px-4 py-2">Stores your language preference</td>
                    <td className="border border-border px-4 py-2">1 year</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-semibold">3. Third-Party Cookies</h2>
            <p>
              Some cookies are placed by third-party services that appear on our pages. We do not control these cookies. Third parties that may set cookies include:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li><strong>Google Analytics</strong> - for website usage analytics</li>
              <li><strong>Stripe</strong> - for payment processing</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold">4. Managing Cookies</h2>
            <p>
              You can control and manage cookies through your browser settings. Most browsers allow you to:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li>View what cookies are stored and delete them individually</li>
              <li>Block third-party cookies</li>
              <li>Block cookies from specific sites</li>
              <li>Block all cookies</li>
              <li>Delete all cookies when you close your browser</li>
            </ul>
            <p className="mt-2">
              Note that blocking essential cookies will prevent the Service from functioning properly.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold">5. Do Not Track</h2>
            <p>
              Some browsers include a &quot;Do Not Track&quot; (DNT) feature. We currently do not respond to DNT signals, as there is no industry standard for compliance. We will update this policy if a standard is established.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold">6. Changes to This Policy</h2>
            <p>
              We may update this Cookie Policy to reflect changes in our practices or for operational, legal, or regulatory reasons. The &quot;Last updated&quot; date at the top indicates when it was last revised.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold">7. Contact Us</h2>
            <p>
              If you have questions about our use of cookies, contact us at{' '}
              <a href="mailto:privacy@execgpt.com" className="text-primary underline">
                privacy@execgpt.com
              </a>.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}

export default withI18n(CookiePolicyPage);
