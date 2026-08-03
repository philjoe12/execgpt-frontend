import Image from 'next/image';
import Link from 'next/link';

import {
  ArrowRightIcon,
  CheckCircle2,
  LockKeyhole,
  WalletCards,
} from 'lucide-react';

const capabilities = [
  {
    title: 'Set tenant policy',
    description:
      'Define approved models, tools, credentials, budgets, and action boundaries before a session starts.',
    icon: LockKeyhole,
  },
  {
    title: 'Launch an isolated workspace',
    description:
      'Prepare the files, runtime, and MCP connections each agent needs without exposing shared secrets.',
    icon: CheckCircle2,
  },
  {
    title: 'Operate with evidence',
    description:
      'Connect tool calls, usage, costs, and outcomes to the tenant and session that produced them.',
    icon: WalletCards,
  },
];

export function BluebearHome() {
  return (
    <div className="bg-slate-950 text-slate-100">
      <section className="relative overflow-hidden px-6 pt-20 pb-24">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(14,165,233,0.18),transparent_35%)]" />
        <div className="relative mx-auto grid max-w-6xl items-center gap-14 lg:grid-cols-2">
          <div>
            <p className="inline-flex rounded-full border border-sky-400/40 bg-sky-400/10 px-4 py-2 text-xs font-semibold tracking-[0.28em] text-sky-200 uppercase">
              Agent deployment plane
            </p>
            <h1 className="mt-8 text-5xl leading-[1.05] font-semibold tracking-tight sm:text-6xl">
              Deploy AI agents with real infrastructure, not scripts.
            </h1>
            <p className="mt-7 max-w-xl text-lg leading-8 text-slate-300">
              BlueBear combines tenant policy, isolated workspaces, and governed
              MCP connections so teams can run agents against real systems with
              clear cost and access boundaries.
            </p>
            <div className="mt-9 flex flex-wrap gap-4">
              <Link
                className="inline-flex items-center gap-2 rounded-lg bg-sky-500 px-5 py-3 font-semibold text-white hover:bg-sky-400"
                href="/auth/sign-up"
              >
                Request access <ArrowRightIcon className="h-4 w-4" />
              </Link>
              <Link
                className="rounded-lg border border-slate-700 px-5 py-3 font-semibold hover:border-sky-400"
                href="/articles/governed-ai-agents-from-pilot-to-production"
              >
                Read the production guide
              </Link>
            </div>
          </div>

          <figure className="overflow-hidden rounded-3xl border border-slate-800 bg-slate-900/80 p-4 shadow-2xl">
            <figcaption className="mb-3 text-xs font-semibold tracking-[0.2em] text-slate-400 uppercase">
              Live product · integration catalog
            </figcaption>
            <Image
              alt="BlueBear integration catalog showing governed MCP connections"
              className="h-auto w-full rounded-2xl bg-white"
              height={810}
              priority
              src="/images/bluebear/integrations-catalog.webp"
              width={1440}
            />
          </figure>
        </div>
      </section>

      <section className="border-y border-slate-800 bg-slate-900/50 px-6 py-20">
        <div className="mx-auto max-w-6xl">
          <p className="text-xs font-semibold tracking-[0.28em] text-sky-300 uppercase">
            How BlueBear works
          </p>
          <h2 className="mt-4 max-w-3xl text-4xl font-semibold tracking-tight">
            Governance is part of the runtime, not a launch checklist.
          </h2>
          <div className="mt-12 grid gap-6 md:grid-cols-3">
            {capabilities.map(({ title, description, icon: Icon }) => (
              <article
                className="rounded-2xl border border-slate-800 bg-slate-950 p-6"
                key={title}
              >
                <Icon className="h-7 w-7 text-sky-400" />
                <h3 className="mt-5 text-xl font-semibold">{title}</h3>
                <p className="mt-3 leading-7 text-slate-400">{description}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="px-6 py-24">
        <div className="mx-auto max-w-6xl">
          <div className="max-w-3xl">
            <p className="text-xs font-semibold tracking-[0.28em] text-sky-300 uppercase">
              Product proof
            </p>
            <h2 className="mt-4 text-4xl font-semibold tracking-tight">
              Show the controls, the workflow, and the evidence.
            </h2>
            <p className="mt-5 text-lg leading-8 text-slate-400">
              Review real integrations and session-level cost evidence, then
              watch the same platform flow end to end.
            </p>
          </div>
          <div className="mt-12 grid gap-8 lg:grid-cols-2">
            <Image
              alt="BlueBear session cost and usage overview"
              className="h-auto w-full rounded-2xl border border-slate-800"
              height={810}
              src="/images/bluebear/session-cost-overview.webp"
              width={1440}
            />
            <video
              className="w-full rounded-2xl border border-slate-800"
              controls
              playsInline
              poster="/images/bluebear/platform-overview-poster.webp"
              preload="metadata"
            >
              <source
                src="/images/bluebear/platform-overview.webm"
                type="video/webm"
              />
              Your browser does not support embedded video.
            </video>
          </div>
        </div>
      </section>
    </div>
  );
}
