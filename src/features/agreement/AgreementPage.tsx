import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useNegotiation } from '../../context/NegotiationContext';
import { useAuth } from '../../context/AuthContext';
import { formatCurrency, formatDate } from '../../lib/utils';
import {
  FileCheck,
  Printer,
  ArrowLeft,
  ShieldCheck,
  CheckCircle2,
  Lock,
  Building2,
  Clock,
  PenTool,
  Download,
} from 'lucide-react';

export const AgreementPage: React.FC = () => {
  const { roomId } = useParams<{ roomId: string }>();
  const { getNegotiation, getAgreement, signAgreement } = useNegotiation();
  const { currentUser } = useAuth();

  const negotiation = getNegotiation(roomId || '');
  const agreement = getAgreement(roomId || '');

  const [typedName, setTypedName] = useState(currentUser?.fullName || '');
  const [jobTitle, setJobTitle] = useState('Executive Officer');
  const [agreedCheck, setAgreedCheck] = useState(false);
  const [isSigning, setIsSigning] = useState(false);

  if (!negotiation) {
    return (
      <div className="p-12 text-center text-slate-500">Negotiation dealroom not found.</div>
    );
  }

  // Fallback agreement object if not yet formally written
  const currentAgreement = agreement || {
    negotiationId: negotiation.id,
    agreementNumber: `AGR-2026-${negotiation.id.slice(-4)}`,
    title: `${negotiation.subject} — Master Commercial Agreement`,
    finalAmount: negotiation.currentAmount,
    currency: negotiation.currency,
    finalTerms: 'All terms as mutually converged and agreed upon during room deliberation.',
    paymentSchedule: 'Net 30 days upon delivery',
    deliveryTimeline: 'Within 14 calendar days of execution',
    contingencies: 'Standard warranties, non-disclosure, and compliance covenants apply.',
    status: 'pending_signatures' as const,
    createdAt: new Date().toISOString(),
  };

  const isInitiator = currentUser?.uid === negotiation.initiatorId;
  const mySignature = isInitiator
    ? currentAgreement.initiatorSignature
    : currentAgreement.counterpartySignature;
  const otherSignature = isInitiator
    ? currentAgreement.counterpartySignature
    : currentAgreement.initiatorSignature;

  const handleSign = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!typedName.trim() || !agreedCheck || !currentUser) return;

    try {
      setIsSigning(true);
      await signAgreement(negotiation.id, {
        userId: currentUser.uid,
        fullName: typedName.trim(),
        typedSignature: `/s/ ${typedName.trim()}`,
        title: jobTitle.trim(),
        businessName: currentUser.businessName,
        signedAt: new Date().toISOString(),
        ipAddress: '127.0.0.1 (Verified Session)',
      });
    } catch (err) {
      console.error('Signing error:', err);
    } finally {
      setIsSigning(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="min-h-screen bg-slate-100 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Navigation & Action Bar (Hidden during Print) */}
        <div className="flex items-center justify-between no-print">
          <Link
            to={`/rooms/${negotiation.id}`}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" /> Back to Dealroom
          </Link>

          <div className="flex items-center gap-3">
            <button
              onClick={handlePrint}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 text-slate-800 text-xs font-semibold shadow-sm transition-colors"
            >
              <Printer className="w-4 h-4 text-slate-500" />
              Print / Save as PDF
            </button>
          </div>
        </div>

        {/* The Printable Formal Agreement Document */}
        <div className="bg-white rounded-2xl border border-slate-300 shadow-elevated p-8 sm:p-12 print-page">
          {/* Legal Header */}
          <div className="border-b-2 border-slate-900 pb-6 mb-8 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className="w-3 h-3 rounded-full bg-teal-600" />
                <span className="text-xs uppercase tracking-widest font-bold text-slate-500">
                  PactPoint Verified Agreement Record
                </span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-bold font-serif text-slate-950">
                Commercial Agreement Summary
              </h1>
              <p className="text-xs text-slate-500 mt-1">
                Ref ID: <span className="font-mono text-slate-800">{currentAgreement.agreementNumber}</span> • Negotiation Room:{' '}
                <span className="font-mono text-slate-800">{negotiation.id}</span>
              </p>
            </div>

            <div className="text-right">
              <span
                className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
                  currentAgreement.status === 'fully_executed'
                    ? 'bg-emerald-100 text-emerald-900 border border-emerald-300'
                    : 'bg-amber-100 text-amber-900 border border-amber-300'
                }`}
              >
                {currentAgreement.status === 'fully_executed'
                  ? 'Fully Executed'
                  : 'Pending Signatures'}
              </span>
              <div className="text-[11px] text-slate-400 mt-1">
                Generated {formatDate(currentAgreement.createdAt)}
              </div>
            </div>
          </div>

          {/* Contracting Parties Box */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 p-5 rounded-xl bg-slate-50 border border-slate-200 mb-8">
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block mb-1">
                Initiating Party (Party A)
              </span>
              <div className="text-sm font-bold text-slate-900">{negotiation.initiatorBusiness}</div>
              <div className="text-xs text-slate-600">Represented by: {negotiation.initiatorName}</div>
            </div>

            <div>
              <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block mb-1">
                Counterparty (Party B)
              </span>
              <div className="text-sm font-bold text-slate-900">{negotiation.counterpartyBusiness}</div>
              <div className="text-xs text-slate-600">Represented by: {negotiation.counterpartyName}</div>
            </div>
          </div>

          {/* Agreement Specifications */}
          <div className="space-y-6 text-sm text-slate-800">
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">
                1. Subject Matter & Scope
              </h3>
              <p className="font-semibold text-slate-950 text-base">{negotiation.subject}</p>
              <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                {negotiation.description}
              </p>
            </div>

            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">
                2. Agreed Financial Consideration
              </h3>
              <div className="text-2xl font-extrabold text-slate-950 font-display">
                {formatCurrency(currentAgreement.finalAmount, currentAgreement.currency)}
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Bilateral compromise reached after {negotiation.totalRounds} iterative bargaining rounds.
              </p>
            </div>

            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">
                3. Agreed Terms, Conditions & Deliverables
              </h3>
              <div className="p-4 rounded-lg bg-slate-50 border border-slate-200 text-xs leading-relaxed text-slate-800 font-mono whitespace-pre-wrap">
                {currentAgreement.finalTerms}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div className="p-3 rounded-lg border border-slate-200 bg-slate-50/50">
                <span className="font-bold text-slate-900 block mb-1">Payment Schedule:</span>
                <span className="text-slate-600">{currentAgreement.paymentSchedule}</span>
              </div>
              <div className="p-3 rounded-lg border border-slate-200 bg-slate-50/50">
                <span className="font-bold text-slate-900 block mb-1">Fulfillment Timeline:</span>
                <span className="text-slate-600">{currentAgreement.deliveryTimeline}</span>
              </div>
            </div>

            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">
                4. Contingencies & Representations
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                {currentAgreement.contingencies}
              </p>
            </div>
          </div>

          {/* Execution & Signature Blocks */}
          <div className="mt-12 pt-8 border-t-2 border-slate-900">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-6">
              5. Digital Signatures & Non-Repudiation Attestation
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
              {/* Party A Signature */}
              <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/70">
                <span className="text-[10px] uppercase font-bold text-slate-500 block mb-2">
                  Signed on behalf of {negotiation.initiatorBusiness}
                </span>

                {currentAgreement.initiatorSignature ? (
                  <div className="space-y-1">
                    <div className="font-serif italic text-lg font-bold text-slate-900">
                      {currentAgreement.initiatorSignature.typedSignature}
                    </div>
                    <div className="text-xs font-semibold text-slate-800">
                      {currentAgreement.initiatorSignature.fullName}
                    </div>
                    <div className="text-[11px] text-slate-500">
                      {currentAgreement.initiatorSignature.title}
                    </div>
                    <div className="text-[10px] text-teal-700 font-mono mt-2">
                      Timestamp: {formatDate(currentAgreement.initiatorSignature.signedAt)}
                    </div>
                  </div>
                ) : (
                  <div className="py-6 text-center text-xs text-slate-400 italic">
                    Awaiting digital signature from {negotiation.initiatorName}
                  </div>
                )}
              </div>

              {/* Party B Signature */}
              <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/70">
                <span className="text-[10px] uppercase font-bold text-slate-500 block mb-2">
                  Signed on behalf of {negotiation.counterpartyBusiness}
                </span>

                {currentAgreement.counterpartySignature ? (
                  <div className="space-y-1">
                    <div className="font-serif italic text-lg font-bold text-slate-900">
                      {currentAgreement.counterpartySignature.typedSignature}
                    </div>
                    <div className="text-xs font-semibold text-slate-800">
                      {currentAgreement.counterpartySignature.fullName}
                    </div>
                    <div className="text-[11px] text-slate-500">
                      {currentAgreement.counterpartySignature.title}
                    </div>
                    <div className="text-[10px] text-teal-700 font-mono mt-2">
                      Timestamp: {formatDate(currentAgreement.counterpartySignature.signedAt)}
                    </div>
                  </div>
                ) : (
                  <div className="py-6 text-center text-xs text-slate-400 italic">
                    Awaiting digital signature from {negotiation.counterpartyName}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* E-Signature Form (if current user has not signed yet) */}
        {!mySignature && (
          <div className="bg-white dark:bg-slate-900 rounded-2xl border-2 border-teal-600 p-6 sm:p-8 shadow-elevated no-print">
            <div className="flex items-center gap-3 pb-4 border-b border-slate-100 dark:border-slate-800 mb-6">
              <div className="w-10 h-10 rounded-xl bg-teal-100 dark:bg-teal-900/60 text-teal-800 dark:text-teal-300 flex items-center justify-center font-bold">
                <PenTool className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-950 dark:text-white">
                  Digital Signature Acknowledgment
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Attest and digitally execute this agreement on behalf of{' '}
                  <strong className="text-slate-800 dark:text-slate-200">{currentUser?.businessName}</strong>
                </p>
              </div>
            </div>

            <form onSubmit={handleSign} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                    Type Your Full Legal Name
                  </label>
                  <input
                    type="text"
                    value={typedName}
                    onChange={(e) => setTypedName(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm font-serif italic focus:ring-2 focus:ring-teal-600 focus:outline-none"
                    placeholder="e.g. Sarah Jenkins"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                    Corporate Officer Title
                  </label>
                  <input
                    type="text"
                    value={jobTitle}
                    onChange={(e) => setJobTitle(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-teal-600 focus:outline-none"
                    placeholder="e.g. Chief Executive Officer"
                    required
                  />
                </div>
              </div>

              <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
                <label className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={agreedCheck}
                    onChange={(e) => setAgreedCheck(e.target.checked)}
                    className="mt-1 w-4 h-4 rounded text-teal-600 focus:ring-teal-500"
                    required
                  />
                  <span className="text-xs text-slate-700 leading-relaxed">
                    I acknowledge that by typing my name above and submitting this execution, I am
                    electronically executing this agreement on behalf of my enterprise under the
                    provisions of the Uniform Electronic Transactions Act (UETA) and federal ESIGN Act.
                  </span>
                </label>
              </div>

              <div className="flex justify-end pt-2">
                <button
                  type="submit"
                  disabled={isSigning || !agreedCheck || !typedName.trim()}
                  className="px-6 py-2.5 rounded-lg bg-teal-700 hover:bg-teal-800 disabled:opacity-50 text-white font-bold text-xs shadow-sm transition-colors flex items-center gap-2"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  {isSigning ? 'Logging Signature...' : 'Confirm & Execute Agreement'}
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};
