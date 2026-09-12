import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Navbar } from '../../components/common/Navbar';
import { Footer } from '../../components/common/Footer';
import {
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  FileSignature,
  Scale,
  Compass,
  FileText,
  Lock,
  Clock,
  Briefcase,
  Users,
  ChevronRight,
  BarChart2,
  Sparkles,
  Layers,
  Building2,
  BadgePercent,
  Check,
} from 'lucide-react';

export const LandingPage: React.FC = () => {
  const [activeWorkflowStep, setActiveWorkflowStep] = useState(0);

  const workflowSteps = [
    {
      step: '01',
      title: 'Initiate Structured Dealroom',
      tagline: 'Define scope, baseline offer, and invite counterparties',
      description:
        'Specify the subject matter, monetary baseline, and milestone requirements. Invite vetted business owners or retained negotiators into a secure, access-controlled room.',
      evidence: 'Bilateral access locks & encrypted room keys provisioned on initialization.',
    },
    {
      step: '02',
      title: 'Exchange Structured Counteroffers',
      tagline: 'Replace scattered email threads with an immutable timeline',
      description:
        'Every counteroffer records exact financial figures, payment schedules, contingencies, and rationale. Previous iterations remain accessible as an audit trail rather than disappearing into inbox noise.',
      evidence: 'Versioned offer records preventing misunderstandings or retroactive claim shifts.',
    },
    {
      step: '03',
      title: 'Quantitative Decision Support',
      tagline: 'Evaluate the spread, round count, and concession pace',
      description:
        'Review real-time mathematical gap analysis between buyer bids and seller asks. Visual trajectory charts illustrate whether terms are converging or reaching an impasse.',
      evidence: 'Rule-based spread analysis calculating mutual settlement probability.',
    },
    {
      step: '04',
      title: 'Formal Acceptance & E-Signature',
      tagline: 'Generate executable agreement summaries instantly',
      description:
        'Upon bilateral acceptance of final terms, PactPoint automatically compiles an Agreement Summary with timestamped digital signature acknowledgment and printable archive.',
      evidence: 'ESIGN & UETA compliant acknowledgment log with non-repudiation audit trail.',
    },
  ];

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col selection:bg-teal-700 selection:text-white">
      <Navbar />

      {/* HERO SECTION */}
      <section className="relative overflow-hidden pt-12 pb-20 md:pt-24 md:pb-32 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex items-center">
        {/* Subtle ledger hairline background instead of dot grid */}
        <div className="absolute inset-0 bg-[linear-gradient(to_bottom,#f1f5f9_1px,transparent_1px)] dark:bg-[linear-gradient(to_bottom,#1e293b_1px,transparent_1px)] bg-[size:100%_3rem] opacity-70 pointer-events-none" />
        
        {/* Subtle vertical rule */}
        <div className="absolute left-4 sm:left-12 top-0 bottom-0 w-px bg-slate-200 dark:bg-slate-800 opacity-50 pointer-events-none" />

        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 relative w-full text-center">
          {/* Headline */}
          <h1 className="text-5xl sm:text-6xl lg:text-7xl font-extrabold text-slate-950 dark:text-white tracking-tight leading-[1.1]">
            Negotiate commercial deals online.
            <span className="block font-serif italic font-medium mt-3 text-emerald-800 dark:text-emerald-400">
              Faster, auditable, defensible.
            </span>
          </h1>

          <p className="mt-6 text-lg sm:text-xl text-slate-600 dark:text-slate-400 max-w-2xl mx-auto leading-relaxed">
            Move high-value contracts out of fragmented email threads. PactPoint gives owners and retained negotiators
            structured rooms to exchange binding counteroffers, track bid-ask convergence, and execute digital agreements
            — with a complete, court-ready paper trail.
          </p>

          {/* CTAs */}
          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              to="/signup"
              className="inline-flex items-center justify-center gap-2 px-7 py-4 rounded-lg bg-slate-900 hover:bg-slate-800 dark:bg-emerald-700 dark:hover:bg-emerald-600 text-white font-semibold text-sm shadow-lg hover:shadow-xl transition-all"
            >
              Create Free Negotiation Room
              <ArrowRight className="w-4 h-4 text-emerald-400 dark:text-white" />
            </Link>
            <a
              href="#how-it-works"
              className="inline-flex items-center justify-center gap-2 px-6 py-4 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-800 dark:text-white font-semibold text-sm transition-colors shadow-sm"
            >
              <Briefcase className="w-4 h-4 text-slate-500 dark:text-slate-400" />
              See How It Works
            </a>
          </div>

          {/* Trust signals / metrics row */}
          <div className="mt-12 pt-8 border-t border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-center gap-8 sm:gap-16 text-slate-700 dark:text-slate-300">
            <div className="text-center">
              <div className="text-3xl font-bold text-slate-950 dark:text-white font-display">68%</div>
              <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">Faster time to execution</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-slate-950 dark:text-white font-display">100%</div>
              <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">Offer lineage & paper trail</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-slate-950 dark:text-white font-display">0%</div>
              <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">Ambiguity in final terms</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-slate-950 dark:text-white font-display">E-Sign</div>
              <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">Compliant digital agreements</div>
            </div>
          </div>
        </div>
      </section>

      {/* HOW IT WORKS SECTION */}
      <section id="how-it-works" className="py-16 md:py-20 bg-slate-100 dark:bg-slate-900/60 border-b border-slate-200 dark:border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mb-12">
            <span className="text-xs font-bold uppercase tracking-wider text-teal-700 dark:text-teal-400">
              Protocol Workflow
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-950 dark:text-white mt-1">
              From initial proposal to executed agreement in four deliberate steps.
            </h2>
            <p className="text-slate-600 dark:text-slate-400 mt-2 text-base">
              Unlike generic messaging apps, every interaction in PactPoint is bound to formal offer
              structures, price anchors, and contingency terms.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* Step Selector Tabs (5 cols) */}
            <div className="lg:col-span-5 space-y-3">
              {workflowSteps.map((item, idx) => (
                <div
                  key={item.step}
                  onClick={() => setActiveWorkflowStep(idx)}
                  className={`p-4 rounded-xl cursor-pointer border transition-all ${
                    activeWorkflowStep === idx
                      ? 'bg-white dark:bg-slate-800 border-teal-600 dark:border-teal-500 shadow-md ring-1 ring-teal-600 dark:ring-teal-500'
                      : 'bg-white/60 dark:bg-slate-900/60 border-slate-200 dark:border-slate-800 hover:bg-white dark:hover:bg-slate-800'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span
                      className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold ${
                        activeWorkflowStep === idx
                          ? 'bg-teal-700 dark:bg-teal-600 text-white'
                          : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300'
                      }`}
                    >
                      {item.step}
                    </span>
                    <div>
                      <div className="text-sm font-bold text-slate-900 dark:text-white">{item.title}</div>
                      <div className="text-xs text-slate-500 dark:text-slate-400">{item.tagline}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Step Detail Card (7 cols) */}
            <div className="lg:col-span-7 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-8 shadow-sm">
              <div className="flex items-center justify-between pb-6 border-b border-slate-100 dark:border-slate-700">
                <div>
                  <span className="text-xs font-bold text-teal-700 dark:text-teal-400 uppercase tracking-wider">
                    Phase {workflowSteps[activeWorkflowStep].step}
                  </span>
                  <h3 className="text-2xl font-bold text-slate-900 dark:text-white mt-0.5">
                    {workflowSteps[activeWorkflowStep].title}
                  </h3>
                </div>
                <div className="w-10 h-10 rounded-xl bg-teal-50 dark:bg-teal-950/60 text-teal-800 dark:text-teal-300 flex items-center justify-center font-bold">
                  <CheckCircle2 className="w-5 h-5" />
                </div>
              </div>

              <p className="text-slate-700 dark:text-slate-300 text-base leading-relaxed mt-6">
                {workflowSteps[activeWorkflowStep].description}
              </p>

              <div className="mt-6 p-4 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200/80 dark:border-slate-700 flex items-start gap-3">
                <ShieldCheck className="w-5 h-5 text-teal-700 dark:text-teal-400 flex-shrink-0 mt-0.5" />
                <div>
                  <div className="text-xs font-bold text-slate-900 dark:text-white">Legal Integrity Standard</div>
                  <div className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">
                    {workflowSteps[activeWorkflowStep].evidence}
                  </div>
                </div>
              </div>

              <div className="mt-8 flex items-center gap-4">
                <Link
                  to="/signup"
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-slate-900 dark:bg-teal-700 hover:bg-slate-800 dark:hover:bg-teal-600 text-white text-xs font-semibold shadow-sm transition-colors"
                >
                  Try this workflow live
                  <ArrowRight className="w-3.5 h-3.5 text-teal-400 dark:text-white" />
                </Link>
                <span className="text-xs text-slate-500 dark:text-slate-400">No software installation required</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* SECURITY & LEGAL ASSURANCE SECTION */}
      <section id="security" className="py-20 bg-white dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="p-8 sm:p-12 rounded-3xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white relative overflow-hidden shadow-sm">
            <div className="relative z-10 max-w-3xl">
              <span className="text-xs font-bold uppercase tracking-wider text-teal-700 dark:text-teal-400">
                Defensibility & Privacy
              </span>
              <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-950 dark:text-white mt-2">
                Built to protect sensitive corporate negotiations.
              </h2>
              <p className="text-slate-600 dark:text-slate-400 mt-3 text-sm leading-relaxed">
                Negotiation documents, valuation anchors, and private concessions remain strictly
                partitioned. Firestore security rules guarantee that unauthorized users cannot inspect
                rooms they are not a named party to.
              </p>

              <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div className="p-4 rounded-xl bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 flex items-start gap-3 shadow-sm">
                  <Lock className="w-4 h-4 text-teal-700 dark:text-teal-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <div className="font-bold text-slate-900 dark:text-white">Granular Access Locks</div>
                    <div className="text-slate-600 dark:text-slate-400 mt-0.5">
                      Only verified parties and appointed negotiators can access room transcripts.
                    </div>
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 flex items-start gap-3 shadow-sm">
                  <ShieldCheck className="w-4 h-4 text-teal-700 dark:text-teal-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <div className="font-bold text-slate-900 dark:text-white">Immutable Audit Trail</div>
                    <div className="text-slate-600 dark:text-slate-400 mt-0.5">
                      Prior counteroffers and accepted terms cannot be silently rewritten or retroactively altered.
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-8 pt-8 border-t border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-start sm:items-center gap-4">
                <Link
                  to="/signup"
                  className="px-6 py-3 rounded-lg bg-teal-600 hover:bg-teal-700 text-white font-semibold text-xs transition-colors shadow-sm"
                >
                  Start Your First Negotiation
                </Link>
                <Link
                  to="/login"
                  className="px-6 py-3 rounded-lg bg-white hover:bg-slate-100 text-slate-800 border border-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-slate-200 dark:border-slate-700 font-semibold text-xs transition-colors"
                >
                  Sign In to Workspace
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};
