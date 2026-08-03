import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Governed AI Agents: From Pilot to Production | BlueBear',
  description:
    'A practical operating model for agent tools, isolated workspaces, budget boundaries, and audit evidence.',
};

const boundaries = [
  ['Data', 'Which tenant, workspace, records, and fields can the agent read?'],
  [
    'Action',
    'Which tools are read-only, which can write, and which require approval?',
  ],
  ['Cost', 'Which models and session, user, or organization budgets apply?'],
  [
    'Time',
    'When does access expire, and when should a long-running session stop?',
  ],
];

export default function GovernedAgentsArticle() {
  return (
    <main className="bg-stone-50 px-6 py-16 text-stone-950">
      <article className="mx-auto max-w-4xl">
        <header className="rounded-3xl border border-stone-200 bg-white p-8 sm:p-12">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-sky-700">
            BlueBear · Production guide
          </p>
          <h1 className="mt-5 text-4xl font-semibold leading-tight tracking-tight sm:text-6xl">
            Governed AI Agents: A Practical Path from Pilot to Production
          </h1>
          <p className="mt-6 max-w-3xl text-xl leading-8 text-stone-600">
            A concrete operating model for giving agents useful tools, isolated
            workspaces, budget boundaries, and an audit trail without slowing
            every rollout to a crawl.
          </p>
        </header>

        <div className="mt-10 space-y-10 rounded-3xl border border-stone-200 bg-white p-8 text-lg leading-8 sm:p-12">
          <section>
            <p>
              An AI agent pilot is easy to approve when it uses sample data and
              a narrow prompt. Production is different: the agent reaches real
              systems, someone must decide which actions it can take, and the
              organization needs a credible answer when security, finance, or a
              customer asks what happened.
            </p>
            <p className="mt-5">
              The useful question is not “How autonomous should this agent be?”
              It is “What must be true before this agent is allowed to act?”
            </p>
          </section>

          <section>
            <h2 className="text-3xl font-semibold tracking-tight">
              Start with the blast radius
            </h2>
            <p className="mt-4">
              Define the maximum damage a failed session could cause before
              choosing a model or building a workflow. Express the answer as
              four reviewable boundaries:
            </p>
            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              {boundaries.map(([title, description]) => (
                <div className="rounded-2xl bg-stone-50 p-5" key={title}>
                  <h3 className="font-semibold text-sky-800">
                    {title} boundary
                  </h3>
                  <p className="mt-2 text-base leading-7 text-stone-700">
                    {description}
                  </p>
                </div>
              ))}
            </div>
          </section>

          <section>
            <h2 className="text-3xl font-semibold tracking-tight">
              Treat integrations as permissions, not features
            </h2>
            <p className="mt-4">
              A long integration list is useful only when each workspace
              receives the right subset. Start with read-only operations, add
              narrowly scoped writes, and put irreversible or customer-facing
              actions behind approval.
            </p>
            <figure className="mt-6">
              <Image
                alt="BlueBear integration catalog showing connected and available MCP services"
                className="h-auto w-full rounded-2xl border border-stone-200"
                height={810}
                src="/images/bluebear/integrations-catalog.webp"
                width={1440}
              />
              <figcaption className="mt-3 text-sm text-stone-500">
                Operators can review connected MCP services before assigning
                them to agent workflows.
              </figcaption>
            </figure>
          </section>

          <section>
            <h2 className="text-3xl font-semibold tracking-tight">
              Make cost part of authorization
            </h2>
            <p className="mt-4">
              A dashboard can explain yesterday’s spend, but it cannot stop an
              expensive loop already in progress. Decide which budget pays,
              whether enough balance is available, and which model tiers may run
              before execution begins. Record actual usage after the session.
            </p>
            <figure className="mt-6">
              <Image
                alt="BlueBear session dashboard showing token usage, tool calls, and cost"
                className="h-auto w-full rounded-2xl border border-stone-200"
                height={810}
                src="/images/bluebear/session-cost-overview.webp"
                width={1440}
              />
              <figcaption className="mt-3 text-sm text-stone-500">
                Session-level evidence connects usage and cost to the workload
                that produced them.
              </figcaption>
            </figure>
          </section>

          <section>
            <h2 className="text-3xl font-semibold tracking-tight">
              Roll out capability in visible stages
            </h2>
            <ol className="mt-5 list-decimal space-y-3 pl-6">
              <li>
                <strong>Observe:</strong> use read-only tools and review
                proposed actions.
              </li>
              <li>
                <strong>Approve:</strong> let the agent prepare writes while a
                human confirms the final action.
              </li>
              <li>
                <strong>Constrain:</strong> automate low-risk writes inside
                explicit data, cost, and time limits.
              </li>
              <li>
                <strong>Expand:</strong> add tools or tenants only after the
                evidence shows the earlier boundary is reliable.
              </li>
            </ol>
          </section>

          <section className="rounded-2xl bg-sky-950 p-7 text-white">
            <h2 className="text-2xl font-semibold">
              Ask to see the failure paths
            </h2>
            <p className="mt-3 text-sky-100">
              In a platform demo, ask what happens when the budget is exhausted
              or a user requests a tool they do not have. Those paths reveal
              more about production readiness than a polished chatbot
              conversation.
            </p>
            <Link
              className="mt-6 inline-flex rounded-lg bg-sky-500 px-5 py-3 font-semibold hover:bg-sky-400"
              href="/auth/sign-up"
            >
              Request BlueBear access
            </Link>
          </section>
        </div>
      </article>
    </main>
  );
}
