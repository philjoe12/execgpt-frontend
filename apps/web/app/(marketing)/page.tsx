import Image from 'next/image';
import Link from 'next/link';

import { ArrowRightIcon, Check, Shield, Zap, Target } from 'lucide-react';

import {
  CtaButton,
  FeatureCard,
  FeatureGrid,
  FeatureShowcase,
  FeatureShowcaseIconContainer,
  Hero,
  Pill,
} from '@kit/ui/marketing';
import { withI18n } from '~/lib/i18n/with-i18n';
import { fetchMarketingContent } from '~/lib/strapi/fetch-marketing-content';
import { getPublicTenantContext } from '~/lib/tenant/get-public-tenant-context';

type MarketingContent = {
  hero?: {
    pill?: string;
    title?: string;
    highlight?: string;
    subtitle?: string;
    ctaLabel?: string;
    ctaHref?: string;
  };
  steps?: Array<{ number?: string; title?: string; description?: string }>;
  trust?: Array<{ value?: string; label?: string }>;
  featuresHeading?: { title?: string; subtitle?: string };
  features?: Array<{
    label?: string;
    description?: string;
    icon?: 'shield' | 'target' | 'zap';
  }>;
  transformation?: {
    title?: string;
    description?: string;
    oldWay?: string[];
    newWay?: string[];
  };
  testimonials?: Array<{ quote?: string; author?: string; role?: string }>;
  lead?: {
    title?: string;
    subtitle?: string;
    primaryCta?: string;
    primaryCtaHref?: string;
    secondaryCta?: string;
    secondaryCtaHref?: string;
  };
  waitlist?: {
    smsOptInEnabled?: boolean;
    smsOptInLabel?: string;
    smsOptInPlaceholder?: string;
  };
  finalCta?: { title?: string; subtitle?: string; ctaLabel?: string; ctaHref?: string };
};

const DEFAULT_CONTENT: MarketingContent = {
  hero: {
    pill: 'AI Powered Actionable Business Intelligence',
    title: 'Ask.',
    highlight: ' Answer. Action.',
    subtitle:
      "We're focused on Ask Answer Action. Securely ask anything about your business, get trusted answers, and turn insights into outcomes.",
    ctaLabel: 'Join the Waitlist',
    ctaHref: '/auth/sign-up?mode=waitlist',
  },
  steps: [
    { number: '1', title: 'Ask', description: 'Securely ask anything about your business.' },
    { number: '2', title: 'Answer', description: 'Get clear, trusted answers from your data in seconds.' },
    { number: '3', title: 'Action', description: 'Put insights to work with AI-driven execution and audit trails.' },
  ],
  trust: [
    { value: 'SOC2', label: 'COMPLIANT' },
    { value: '256-bit', label: 'ENCRYPTED' },
    { value: '99.9%', label: 'UPTIME' },
    { value: 'Zero', label: 'DATA SHARING' },
  ],
  featuresHeading: {
    title: 'Your data stays yours.',
    subtitle: 'Access insights from confidential business data without compromising security or privacy.',
  },
  features: [
    {
      label: 'Enterprise Security',
      description: 'Your data never leaves your environment. Use leading LLMs or deploy private models for complete control over your AI infrastructure.',
      icon: 'shield',
    },
    {
      label: 'Actionable Intelligence',
      description: 'Go beyond reports. EXECgpt agents can execute tasks, generate documents, and automate workflows based on your queries.',
      icon: 'target',
    },
    {
      label: 'Unified Data Access',
      description: 'Connect financial systems, HR platforms, CRM, email, and more. Ask questions that span your entire organization.',
      icon: 'zap',
    },
  ],
  transformation: {
    title: 'Transform how executives access information',
    description:
      'EXECgpt bridges the gap between your confidential business data and the power of AI - giving financial leaders instant, secure access to actionable intelligence.',
    oldWay: ['Manual report generation', 'Waiting for IT/Analytics', 'Siloed data sources', 'Security concerns with AI'],
    newWay: ['Instant natural language queries', 'Self-service insights', 'Unified data platform', 'Enterprise-grade security'],
  },
  testimonials: [
    {
      quote:
        "Finally, I can ask questions about our financial data without waiting days for a custom report. Game-changing for quarterly planning.",
      author: 'CFO',
      role: 'Fortune 500 Company',
    },
    {
      quote:
        'The security model convinced our CISO. Our data never leaves our environment, and we get the power of modern AI.',
      author: 'CTO',
      role: 'Healthcare Organization',
    },
    {
      quote:
        'Cross-referencing HR, finance, and operations data in one query? That used to take our team weeks.',
      author: 'COO',
      role: 'Private Equity Firm',
    },
  ],
  lead: {
    title: 'See EXECgpt in Action',
    subtitle:
      'Join leading financial executives who are transforming how they access and act on business intelligence. Be among the first to experience AI-powered executive decision support.',
    primaryCta: 'REQUEST DEMO',
    primaryCtaHref: process.env.NEXT_PUBLIC_DEMO_URL || '/auth/sign-up?mode=waitlist',
  },
  finalCta: {
    title: 'Ready to let your business data perform?',
    subtitle: 'Unlock it with AI and ExecGPT.',
    ctaLabel: 'JOIN THE WAITLIST',
    ctaHref: '/auth/sign-up?mode=waitlist',
  },
};

function iconForFeature(icon?: string) {
  switch (icon) {
    case 'shield':
      return <Shield className="w-12 h-12" />;
    case 'target':
      return <Target className="w-12 h-12" />;
    case 'zap':
    default:
      return <Zap className="w-12 h-12" />;
  }
}

async function Home() {
  const tenantContext = await getPublicTenantContext();
  const cmsContent = await fetchMarketingContent<MarketingContent>({
    slug: 'home',
    tenantSlug: tenantContext?.tenant_slug,
  });
  const content = { ...DEFAULT_CONTENT, ...(cmsContent || {}) };
  const hero = content.hero || DEFAULT_CONTENT.hero!;
  const steps = content.steps?.length ? content.steps : DEFAULT_CONTENT.steps!;
  const trust = content.trust?.length ? content.trust : DEFAULT_CONTENT.trust!;
  const featuresHeading = content.featuresHeading || DEFAULT_CONTENT.featuresHeading!;
  const features = content.features?.length ? content.features : DEFAULT_CONTENT.features!;
  const transformation = content.transformation || DEFAULT_CONTENT.transformation!;
  const testimonials = content.testimonials?.length ? content.testimonials : DEFAULT_CONTENT.testimonials!;
  const lead = content.lead || DEFAULT_CONTENT.lead!;
  const finalCta = content.finalCta || DEFAULT_CONTENT.finalCta!;
  const demoHref = lead.primaryCtaHref || DEFAULT_CONTENT.lead?.primaryCtaHref || '/auth/sign-up?mode=waitlist';
  const secondaryLeadHref = lead.secondaryCtaHref || DEFAULT_CONTENT.lead?.secondaryCtaHref;

  return (
    <div className={'mt-4 flex flex-col space-y-24 py-14'}>
      {/* Hero Section with 3-Step Process */}
      <div className={'container mx-auto'}>
        <Hero
          pill={
            <Pill label={'New'}>
              <span>{hero.pill}</span>
            </Pill>
          }
          title={
            <>
              <span>{hero.title}</span>
              <span className="text-primary">{hero.highlight}</span>
            </>
          }
          subtitle={
            <span>
              {hero.subtitle}
            </span>
          }
          cta={
            <CtaButton size="lg">
              <Link href={hero.ctaHref || '/auth/sign-up'}>
                <span className={'flex items-center space-x-2'}>
                  <span>{hero.ctaLabel || 'Get Started'}</span>
                  <ArrowRightIcon className={'h-5 w-5'} />
                </span>
              </Link>
            </CtaButton>
          }
        />

        {/* 3-Step Process */}
        <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-8">
          {steps.map((step, index) => (
            <ProcessStep
              key={`${step.title || index}`}
              number={step.number || `${index + 1}`}
              title={step.title || ''}
              description={step.description || ''}
            />
          ))}
        </div>
      </div>

      <div className="container mx-auto">
        <div className="flex justify-center">
          <Image
            src="/images/ask-answer-action.png"
            alt="Ask, Answer, Action workflow"
            width={1270}
            height={560}
            className="h-auto w-full max-w-5xl"
            priority
          />
        </div>
      </div>

      {/* Trust Indicators */}
      <div className={'container mx-auto'}>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
          {trust.map((item, index) => (
            <TrustIndicator
              key={`${item.label || index}`}
              value={item.value || ''}
              label={item.label || ''}
            />
          ))}
        </div>
      </div>

      {/* Features Section - Stop doing it the old way */}
      <div className={'container mx-auto'}>
        <div className={'flex flex-col space-y-16'}>
          <FeatureShowcase
            heading={
              <>
                <b className="font-semibold dark:text-white">
                  {featuresHeading.title}
                </b>
                .{' '}
                <span className="text-muted-foreground font-normal">
                  {featuresHeading.subtitle}
                </span>
              </>
            }
            icon={
              <FeatureShowcaseIconContainer>
                <Zap className="h-5" />
                <span>Revolutionary approach</span>
              </FeatureShowcaseIconContainer>
            }
          >
            <FeatureGrid>
              {features.map((feature, index) => (
                <FeatureCard
                  key={`${feature.label || index}`}
                  className={
                    index === features.length - 1
                      ? 'relative col-span-2 overflow-hidden'
                      : 'relative col-span-2 overflow-hidden lg:col-span-1'
                  }
                  label={feature.label || ''}
                  description={feature.description || ''}
                  icon={iconForFeature(feature.icon)}
                />
              ))}
            </FeatureGrid>
          </FeatureShowcase>
        </div>
      </div>

      {/* Transformation Story */}
      <div className={'bg-muted/50 py-16'}>
        <div className={'container mx-auto text-center'}>
          <h2 className="text-3xl font-bold mb-8">{transformation.title}</h2>
          <p className="text-lg text-muted-foreground max-w-3xl mx-auto mb-12">
            {transformation.description}
          </p>
          
          {/* Old Way vs New Way */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            <ComparisonCard 
              title="OLD WAY"
              items={transformation.oldWay || []}
              variant="old"
            />
            <ComparisonCard 
              title="NEW WAY"
              items={transformation.newWay || []}
              variant="new"
            />
          </div>
        </div>
      </div>

      {/* Social Proof */}
      <div className={'container mx-auto'}>
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold mb-4">The Results They Need</h2>
          <p className="text-muted-foreground">Yes, that's right. They want that.</p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {testimonials.map((item, index) => (
            <TestimonialCard
              key={`${item.author || index}`}
              quote={item.quote || ''}
              author={item.author || ''}
              role={item.role || ''}
            />
          ))}
        </div>
      </div>

      {/* Lead Generator */}
      <div className={'bg-primary/5 py-16'}>
        <div className={'container mx-auto text-center'}>
          <h2 className="text-3xl font-bold mb-4">{lead.title}</h2>
          <p className="text-lg text-muted-foreground mb-8">
            {lead.subtitle}
          </p>
          <div className="flex justify-center gap-4">
            <CtaButton size="lg">
              <Link href={demoHref}>
                <span>{lead.primaryCta}</span>
              </Link>
            </CtaButton>
            {lead.secondaryCta ? (
              <CtaButton variant="outline" size="lg">
                <Link href={secondaryLeadHref || '#'}>
                  <span>{lead.secondaryCta}</span>
                </Link>
              </CtaButton>
            ) : null}
          </div>
        </div>
      </div>

      {/* Final CTA */}
      <div className={'container mx-auto text-center py-16'}>
        <h2 className="text-4xl font-bold mb-6">{finalCta.title}</h2>
        <p className="text-xl text-muted-foreground mb-8">
          {finalCta.subtitle}
        </p>
        <div className="flex justify-center">
          <CtaButton size="lg">
            <Link href={finalCta.ctaHref || '/auth/sign-up'}>
              <span className={'flex items-center space-x-2'}>
                <span>{finalCta.ctaLabel}</span>
                <ArrowRightIcon className={'h-5 w-5'} />
              </span>
            </Link>
          </CtaButton>
        </div>
      </div>
    </div>
  );
}

export default withI18n(Home);

function ProcessStep({ number, title, description }: { number: string; title: string; description: string }) {
  return (
    <div className="text-center">
      <div className="w-16 h-16 rounded-full bg-primary text-primary-foreground flex items-center justify-center mx-auto mb-4 text-2xl font-bold">
        {number}
      </div>
      <h3 className="text-xl font-semibold mb-2">{title}</h3>
      <p className="text-muted-foreground">{description}</p>
    </div>
  );
}

function TrustIndicator({ value, label }: { value: string; label: string }) {
  return (
    <div>
      <div className="text-3xl font-bold text-primary">{value}</div>
      <div className="text-sm text-muted-foreground uppercase tracking-wider">{label}</div>
    </div>
  );
}

function ComparisonCard({ title, items, variant }: { title: string; items: string[]; variant: 'old' | 'new' }) {
  const isOld = variant === 'old';
  return (
    <div className={`rounded-lg p-6 ${isOld ? 'bg-destructive/10' : 'bg-primary/10'}`}>
      <h3 className={`text-xl font-bold mb-4 ${isOld ? 'text-destructive' : 'text-primary'}`}>{title}</h3>
      <ul className="space-y-2">
        {items.map((item, index) => (
          <li key={index} className="flex items-center gap-2">
            {isOld ? (
              <span className="text-destructive">✗</span>
            ) : (
              <Check className="w-5 h-5 text-primary" />
            )}
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function TestimonialCard({ quote, author, role }: { quote: string; author: string; role: string }) {
  return (
    <div className="bg-muted/50 rounded-lg p-6">
      <p className="italic mb-4">"{quote}"</p>
      <div>
        <div className="font-semibold">{author}</div>
        <div className="text-sm text-muted-foreground">{role}</div>
      </div>
    </div>
  );
}
