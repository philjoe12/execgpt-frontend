import { SitePageHeader } from '~/(marketing)/_components/site-page-header';
import { createI18nServerInstance } from '~/lib/i18n/i18n.server';
import { withI18n } from '~/lib/i18n/with-i18n';

export async function generateMetadata() {
  const { t } = await createI18nServerInstance();

  return {
    title: t('marketing:termsOfService'),
  };
}

async function TermsOfServicePage() {
  const { t } = await createI18nServerInstance();

  return (
    <div>
      <SitePageHeader
        title={t(`marketing:termsOfService`)}
        subtitle={t(`marketing:termsOfServiceDescription`)}
      />

      <div className={'container mx-auto py-8 max-w-4xl'}>
        <div className="prose prose-gray dark:prose-invert max-w-none space-y-8">
          <p className="text-muted-foreground">
            Last updated: February 25, 2026
          </p>

          <section>
            <h2 className="text-2xl font-semibold">1. Acceptance of Terms</h2>
            <p>
              By accessing or using ExecGPT (&quot;the Service&quot;), operated by ExecGPT Inc. (&quot;we,&quot; &quot;us,&quot; or &quot;our&quot;), you agree to be bound by these Terms of Service. If you do not agree to these terms, do not use the Service.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold">2. Description of Service</h2>
            <p>
              ExecGPT provides AI-powered business intelligence tools that allow users to securely query their business data, receive insights, and take actions through natural language interfaces. The Service includes web-based dashboards, API access, and AI agent capabilities.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold">3. User Accounts</h2>
            <p>
              To use the Service, you must create an account and provide accurate, complete information. You are responsible for maintaining the confidentiality of your account credentials and for all activities that occur under your account. You agree to notify us immediately of any unauthorized use of your account.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold">4. Acceptable Use</h2>
            <p>You agree not to:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Use the Service for any unlawful purpose or in violation of any applicable laws</li>
              <li>Attempt to gain unauthorized access to any portion of the Service or its related systems</li>
              <li>Interfere with or disrupt the integrity or performance of the Service</li>
              <li>Reverse engineer, decompile, or disassemble any aspect of the Service</li>
              <li>Use the Service to store or transmit malicious code or harmful content</li>
              <li>Resell or redistribute the Service without prior written authorization</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold">5. Data and Privacy</h2>
            <p>
              Your use of the Service is also governed by our Privacy Policy. You retain all ownership rights to data you provide to the Service. We process your data solely to provide and improve the Service. Your data is encrypted in transit and at rest, and we do not share your data with third parties except as described in our Privacy Policy.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold">6. Intellectual Property</h2>
            <p>
              The Service, including its original content, features, and functionality, is owned by ExecGPT Inc. and is protected by international copyright, trademark, patent, trade secret, and other intellectual property laws. Our trademarks may not be used without prior written consent.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold">7. Subscription and Billing</h2>
            <p>
              Certain features of the Service require a paid subscription. Subscription fees are billed in advance on a monthly or annual basis. You agree to pay all fees associated with your selected plan. Fees are non-refundable except as required by law or as explicitly stated in our refund policy.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold">8. Service Availability</h2>
            <p>
              We strive to maintain 99.9% uptime but do not guarantee uninterrupted access. We may perform scheduled maintenance with advance notice. We are not liable for any downtime, data loss, or service interruptions caused by factors beyond our reasonable control.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold">9. Limitation of Liability</h2>
            <p>
              To the maximum extent permitted by law, ExecGPT Inc. shall not be liable for any indirect, incidental, special, consequential, or punitive damages, or any loss of profits or revenues, whether incurred directly or indirectly. Our total liability for any claim arising from or related to the Service shall not exceed the amount you paid us in the twelve (12) months preceding the claim.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold">10. Disclaimer of Warranties</h2>
            <p>
              The Service is provided &quot;as is&quot; and &quot;as available&quot; without warranties of any kind, either express or implied. AI-generated insights are informational and should not be considered professional financial, legal, or business advice. You are responsible for verifying the accuracy of any outputs before making business decisions.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold">11. Termination</h2>
            <p>
              We may terminate or suspend your account at any time for violation of these Terms. Upon termination, your right to use the Service ceases immediately. You may request export of your data within 30 days of termination.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold">12. Governing Law</h2>
            <p>
              These Terms shall be governed by and construed in accordance with the laws of the State of Delaware, United States, without regard to its conflict of law provisions.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold">13. Changes to Terms</h2>
            <p>
              We reserve the right to modify these Terms at any time. We will notify users of material changes via email or through the Service. Continued use of the Service after changes constitutes acceptance of the new Terms.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold">14. Contact</h2>
            <p>
              If you have questions about these Terms, please contact us at{' '}
              <a href="mailto:legal@execgpt.com" className="text-primary underline">
                legal@execgpt.com
              </a>.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}

export default withI18n(TermsOfServicePage);
