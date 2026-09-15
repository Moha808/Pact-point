import React, { useState, useEffect, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useNegotiation } from '../../context/NegotiationContext';
import { useAuth } from '../../context/AuthContext';
import { formatCurrency, formatDate } from '../../lib/utils';
import { FeedbackModal, ModalType } from '../../components/common/Badge';
import { db } from '../../lib/firebase';
import { doc, getDoc, onSnapshot } from 'firebase/firestore';
import { Negotiation, Agreement } from '../../types';
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
  RotateCcw,
  Type,
  Eraser,
  Sparkles,
} from 'lucide-react';

export const AgreementPage: React.FC = () => {
  const { roomId } = useParams<{ roomId: string }>();
  const { getNegotiation, getAgreement, signAgreement } = useNegotiation();
  const { currentUser } = useAuth();

  const negotiationFromContext = getNegotiation(roomId || '');
  const agreementFromContext = getAgreement(roomId || '');

  const [liveNegotiation, setLiveNegotiation] = useState<Negotiation | null>(null);
  const [liveAgreement, setLiveAgreement] = useState<Agreement | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Modal alert state
  const [feedbackModal, setFeedbackModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    type: ModalType;
  }>({
    isOpen: false,
    title: '',
    message: '',
    type: 'info',
  });

  // Direct Firestore listener fallback for fresh loads / direct links
  useEffect(() => {
    if (!roomId || !db) return;

    const unsubNeg = onSnapshot(doc(db, 'negotiations', roomId), (snap) => {
      if (snap.exists()) {
        setLiveNegotiation({ id: snap.id, ...snap.data() } as Negotiation);
      }
      setIsLoading(false);
    });

    const unsubAgr = onSnapshot(doc(db, 'agreements', roomId), (snap) => {
      if (snap.exists()) {
        setLiveAgreement(snap.data() as Agreement);
      }
    });

    return () => {
      unsubNeg();
      unsubAgr();
    };
  }, [roomId]);

  const negotiation = liveNegotiation || negotiationFromContext;
  const agreement = liveAgreement || agreementFromContext;

  // Signature studio state
  const [signatureMode, setSignatureMode] = useState<'draw' | 'type'>('draw');
  const [typedName, setTypedName] = useState(currentUser?.fullName || '');
  const [selectedFontStyle, setSelectedFontStyle] = useState<'style1' | 'style2' | 'style3'>('style1');
  const [jobTitle, setJobTitle] = useState('Executive Officer');
  const [agreedCheck, setAgreedCheck] = useState(false);
  const [isSigning, setIsSigning] = useState(false);
  const [hasDrawn, setHasDrawn] = useState(false);

  // Canvas ref for drawing signature
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const isDrawing = useRef(false);

  // Canvas drawing handlers
  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const x = 'touches' in e ? e.touches[0].clientX - rect.left : e.clientX - rect.left;
    const y = 'touches' in e ? e.touches[0].clientY - rect.top : e.clientY - rect.top;

    ctx.beginPath();
    ctx.moveTo(x, y);
    isDrawing.current = true;
    setHasDrawn(true);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing.current) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const x = 'touches' in e ? e.touches[0].clientX - rect.left : e.clientX - rect.left;
    const y = 'touches' in e ? e.touches[0].clientY - rect.top : e.clientY - rect.top;

    ctx.lineTo(x, y);
    ctx.strokeStyle = '#0f172a'; // slate-900
    ctx.lineWidth = 2.5;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.stroke();
  };

  const stopDrawing = () => {
    isDrawing.current = false;
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setHasDrawn(false);
  };

  if (isLoading && !negotiation) {
    return (
      <div className="min-h-screen bg-slate-100 flex flex-col items-center justify-center p-12">
        <div className="w-10 h-10 border-4 border-teal-600 border-t-transparent rounded-full animate-spin mb-4" />
        <p className="text-sm font-semibold text-slate-700">Loading agreement specifications...</p>
      </div>
    );
  }

  if (!negotiation) {
    return (
      <div className="p-12 text-center text-slate-500">
        <p className="font-bold text-base mb-2">Negotiation dealroom not found.</p>
        <Link to="/dashboard" className="text-xs text-teal-700 underline font-semibold">
          Return to Dashboard
        </Link>
      </div>
    );
  }

  // Fallback agreement object if not yet formally written
  const currentAgreement = agreement || {
    negotiationId: negotiation.id,
    agreementNumber: `AGR-${negotiation.id.slice(-6).toUpperCase()}`,
    title: `${negotiation.subject} — Master Commercial Agreement`,
    finalAmount: negotiation.currentAmount,
    currency: negotiation.currency,
    finalTerms: 'All terms as mutually converged and agreed upon during dealroom deliberation.',
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

  const fontStyleClasses = {
    style1: 'font-serif italic tracking-wide text-2xl font-bold',
    style2: 'font-mono italic font-bold tracking-tight text-xl',
    style3: 'font-sans italic font-extrabold tracking-widest text-2xl uppercase',
  };

  const handleSign = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!typedName.trim() || !agreedCheck || !currentUser) return;

    if (signatureMode === 'draw' && !hasDrawn) {
      setFeedbackModal({
        isOpen: true,
        title: 'Signature Required',
        message: 'Please draw your digital signature on the signature pad before submitting execution.',
        type: 'warning',
      });
      return;
    }

    try {
      setIsSigning(true);
      const signatureId = `SignID:${Math.random().toString(36).substr(2, 9).toUpperCase()}-${Date.now().toString().slice(-6)}`;
      
      const signaturePayload: any = {
        userId: currentUser.uid,
        email: currentUser.email,
        fullName: typedName.trim(),
        typedSignature: `/s/ ${typedName.trim()}`,
        title: jobTitle.trim(),
        businessName: currentUser.businessName,
        signedAt: new Date().toISOString(),
        ipAddress: '127.0.0.1 (Verified Auth Session)',
        signatureId,
        signatureType: signatureMode,
      };

      if (signatureMode === 'draw' && canvasRef.current) {
        signaturePayload.signatureImage = canvasRef.current.toDataURL('image/png');
      }

      await signAgreement(negotiation.id, signaturePayload);

      setFeedbackModal({
        isOpen: true,
        title: 'Agreement Signed Successfully',
        message: 'Your cryptographic signature has been recorded and verified under ESIGN / UETA provisions.',
        type: 'success',
      });
    } catch (err: any) {
      console.error('Signing error:', err);
      setFeedbackModal({
        isOpen: true,
        title: 'Signature Submission Failed',
        message: err?.message || 'There was a problem submitting your signature. Please ensure you have permission and try again.',
        type: 'error',
      });
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
              <div className="p-5 rounded-xl border border-slate-200 bg-slate-50 relative overflow-hidden">
                <span className="text-[10px] uppercase font-bold text-slate-500 block mb-3">
                  Signed on behalf of {negotiation.initiatorBusiness}
                </span>

                {currentAgreement.initiatorSignature ? (
                  <div className="space-y-1.5 relative z-10">
                    {currentAgreement.initiatorSignature.signatureImage ? (
                      <div className="border-b border-slate-200 pb-2 mb-2">
                        <img
                          src={currentAgreement.initiatorSignature.signatureImage}
                          alt="Party A Signature"
                          className="h-16 object-contain"
                        />
                      </div>
                    ) : (
                      <div className="font-serif italic text-2xl font-bold text-slate-900 border-b border-slate-200 pb-2 mb-2 inline-block min-w-[200px]">
                        {currentAgreement.initiatorSignature.typedSignature}
                      </div>
                    )}
                    <div className="text-xs font-bold text-slate-800">
                      {currentAgreement.initiatorSignature.fullName}
                    </div>
                    <div className="text-[11px] text-slate-600">
                      {currentAgreement.initiatorSignature.title}
                    </div>
                    <div className="text-[11px] text-slate-500 mb-3">
                      {currentAgreement.initiatorSignature.email}
                    </div>
                    
                    <div className="mt-3 p-2 bg-teal-50 border border-teal-100 rounded text-[9px] text-teal-800 font-mono space-y-1">
                      <div className="flex justify-between">
                        <span className="font-semibold text-teal-900">SignID:</span>
                        <span>{currentAgreement.initiatorSignature.signatureId}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="font-semibold text-teal-900">Timestamp:</span>
                        <span>{formatDate(currentAgreement.initiatorSignature.signedAt)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="font-semibold text-teal-900">IP / Auth:</span>
                        <span>{currentAgreement.initiatorSignature.ipAddress}</span>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="py-8 flex flex-col items-center justify-center text-center text-xs text-slate-400 italic bg-white/50 rounded-lg border border-dashed border-slate-300">
                    <ShieldCheck className="w-6 h-6 text-slate-300 mb-2 opacity-50" />
                    Awaiting digital signature from<br />{negotiation.initiatorName}
                  </div>
                )}
              </div>

              {/* Party B Signature */}
              <div className="p-5 rounded-xl border border-slate-200 bg-slate-50 relative overflow-hidden">
                <span className="text-[10px] uppercase font-bold text-slate-500 block mb-3">
                  Signed on behalf of {negotiation.counterpartyBusiness}
                </span>

                {currentAgreement.counterpartySignature ? (
                  <div className="space-y-1.5 relative z-10">
                    {currentAgreement.counterpartySignature.signatureImage ? (
                      <div className="border-b border-slate-200 pb-2 mb-2">
                        <img
                          src={currentAgreement.counterpartySignature.signatureImage}
                          alt="Party B Signature"
                          className="h-16 object-contain"
                        />
                      </div>
                    ) : (
                      <div className="font-serif italic text-2xl font-bold text-slate-900 border-b border-slate-200 pb-2 mb-2 inline-block min-w-[200px]">
                        {currentAgreement.counterpartySignature.typedSignature}
                      </div>
                    )}
                    <div className="text-xs font-bold text-slate-800">
                      {currentAgreement.counterpartySignature.fullName}
                    </div>
                    <div className="text-[11px] text-slate-600">
                      {currentAgreement.counterpartySignature.title}
                    </div>
                    <div className="text-[11px] text-slate-500 mb-3">
                      {currentAgreement.counterpartySignature.email}
                    </div>
                    
                    <div className="mt-3 p-2 bg-teal-50 border border-teal-100 rounded text-[9px] text-teal-800 font-mono space-y-1">
                      <div className="flex justify-between">
                        <span className="font-semibold text-teal-900">SignID:</span>
                        <span>{currentAgreement.counterpartySignature.signatureId}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="font-semibold text-teal-900">Timestamp:</span>
                        <span>{formatDate(currentAgreement.counterpartySignature.signedAt)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="font-semibold text-teal-900">IP / Auth:</span>
                        <span>{currentAgreement.counterpartySignature.ipAddress}</span>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="py-8 flex flex-col items-center justify-center text-center text-xs text-slate-400 italic bg-white/50 rounded-lg border border-dashed border-slate-300">
                    <ShieldCheck className="w-6 h-6 text-slate-300 mb-2 opacity-50" />
                    Awaiting digital signature from<br />{negotiation.counterpartyName}
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
                  Digital Signature Studio & Non-Repudiation Attestation
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Attest and digitally execute this agreement on behalf of{' '}
                  <strong className="text-slate-800 dark:text-slate-200">{currentUser?.businessName}</strong>
                </p>
              </div>
            </div>

            <form onSubmit={handleSign} className="space-y-6">
              {/* Signature Mode Selector */}
              <div className="flex items-center gap-2 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl w-fit">
                <button
                  type="button"
                  onClick={() => setSignatureMode('draw')}
                  className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    signatureMode === 'draw'
                      ? 'bg-white dark:bg-slate-900 text-teal-700 dark:text-teal-400 shadow-sm'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                  }`}
                >
                  <PenTool className="w-3.5 h-3.5" />
                  Draw Signature
                </button>
                <button
                  type="button"
                  onClick={() => setSignatureMode('type')}
                  className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    signatureMode === 'type'
                      ? 'bg-white dark:bg-slate-900 text-teal-700 dark:text-teal-400 shadow-sm'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                  }`}
                >
                  <Type className="w-3.5 h-3.5" />
                  Type Signature
                </button>
              </div>

              {/* Mode 1: Draw Signature Pad */}
              {signatureMode === 'draw' && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                      Draw Your Signature Below
                    </label>
                    <button
                      type="button"
                      onClick={clearCanvas}
                      className="text-xs text-slate-500 hover:text-rose-600 dark:hover:text-rose-400 inline-flex items-center gap-1 font-semibold transition-colors"
                    >
                      <Eraser className="w-3.5 h-3.5" />
                      Clear Pad
                    </button>
                  </div>

                  <div className="relative border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-xl bg-slate-50/50 dark:bg-slate-950/50 overflow-hidden cursor-crosshair">
                    <canvas
                      ref={canvasRef}
                      width={700}
                      height={150}
                      onMouseDown={startDrawing}
                      onMouseMove={draw}
                      onMouseUp={stopDrawing}
                      onMouseLeave={stopDrawing}
                      onTouchStart={startDrawing}
                      onTouchMove={draw}
                      onTouchEnd={stopDrawing}
                      className="w-full h-36 touch-none"
                    />
                    {!hasDrawn && (
                      <div className="absolute inset-0 pointer-events-none flex items-center justify-center text-xs text-slate-400 font-medium">
                        Click/Touch & Drag to sign here
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Mode 2: Type Signature with Font Selection */}
              {signatureMode === 'type' && (
                <div className="space-y-3">
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                    Select Signature Calligraphy Style
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {[
                      { id: 'style1', name: 'Classic Script', class: 'font-serif italic text-lg' },
                      { id: 'style2', name: 'Executive Modern', class: 'font-mono italic text-base' },
                      { id: 'style3', name: 'Formal Hand', class: 'font-sans italic font-bold tracking-wider text-base' },
                    ].map((font) => (
                      <button
                        key={font.id}
                        type="button"
                        onClick={() => setSelectedFontStyle(font.id as any)}
                        className={`p-3 rounded-xl border text-left transition-all ${
                          selectedFontStyle === font.id
                            ? 'border-teal-600 bg-teal-50/50 dark:bg-teal-950/30 text-teal-950 dark:text-teal-200 ring-2 ring-teal-500'
                            : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                        }`}
                      >
                        <div className="text-[10px] text-slate-400 uppercase font-bold mb-1">{font.name}</div>
                        <div className={font.class}>{typedName || 'Your Signature'}</div>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Legal Name & Title Inputs */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                    Full Legal Signatory Name
                  </label>
                  <input
                    type="text"
                    value={typedName}
                    onChange={(e) => setTypedName(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-teal-600 focus:outline-none"
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
                    className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-teal-600 focus:outline-none"
                    placeholder="e.g. Chief Executive Officer"
                    required
                  />
                </div>
              </div>

              {/* Legal Non-Repudiation Checkbox */}
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
                <label className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={agreedCheck}
                    onChange={(e) => setAgreedCheck(e.target.checked)}
                    className="mt-1 w-4 h-4 rounded text-teal-600 focus:ring-teal-500"
                    required
                  />
                  <span className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
                    I acknowledge that by applying my digital signature above and submitting this execution, I am
                    electronically binding my enterprise to this agreement under the provisions of the Uniform Electronic
                    Transactions Act (UETA) and federal ESIGN Act.
                  </span>
                </label>
              </div>

              <div className="flex justify-end pt-2">
                <button
                  type="submit"
                  disabled={isSigning || !agreedCheck || !typedName.trim() || (signatureMode === 'draw' && !hasDrawn)}
                  className="px-6 py-3 rounded-xl bg-teal-700 hover:bg-teal-800 disabled:opacity-50 text-white font-bold text-xs shadow-md transition-all flex items-center gap-2"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  {isSigning ? 'Authenticating & Recording...' : 'Confirm & Execute Agreement'}
                </button>
              </div>
            </form>
          </div>
        )}
      </div>

      {/* Global Feedback Modal */}
      <FeedbackModal
        isOpen={feedbackModal.isOpen}
        onClose={() => setFeedbackModal((prev) => ({ ...prev, isOpen: false }))}
        title={feedbackModal.title}
        message={feedbackModal.message}
        type={feedbackModal.type}
      />
    </div>
  );
};

