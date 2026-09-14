import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useNegotiation } from '../../context/NegotiationContext';
import { useAuth } from '../../context/AuthContext';
import { StatusBadge, RoleBadge } from '../../components/common/Badge';
import { DecisionSupportPanel } from '../../components/decisionSupport/DecisionSupportPanel';
import { formatCurrency, formatDate, formatRelativeTime, sanitizeText } from '../../lib/utils';
import { Offer, ChatMessage, NegotiationDocument, Negotiation } from '../../types';
import { db } from '../../lib/firebase';
import { doc, getDoc, collection, query, orderBy, onSnapshot } from 'firebase/firestore';
import {
  Briefcase,
  Layers,
  FileCheck,
  Send,
  Paperclip,
  ArrowLeft,
  CheckCircle,
  XCircle,
  Clock,
  Building2,
  DollarSign,
  FileText,
  AlertCircle,
  ShieldCheck,
  Download,
  Upload,
  MessageSquare,
  Sparkles,
} from 'lucide-react';

export const NegotiationRoomPage: React.FC = () => {
  const { roomId } = useParams<{ roomId: string }>();
  const navigate = useNavigate();
  const {
    getNegotiation,
    getOffers,
    getMessages,
    getDocuments,
    submitCounteroffer,
    acceptOffer,
    rejectOffer,
    sendMessage,
    uploadDocument,
  } = useNegotiation();
  const { currentUser, userRole } = useAuth();

  const negotiationFromContext = getNegotiation(roomId || '');

  // Direct-fetch fallback: if the room isn't in the onSnapshot state yet (e.g. race condition
  // right after creation), fetch it directly from Firestore by document ID.
  const [directFetch, setDirectFetch] = useState<Negotiation | null | 'loading'>('loading');
  useEffect(() => {
    if (negotiationFromContext) {
      setDirectFetch(null);
      return;
    }
    if (!db || !roomId) {
      setDirectFetch(null);
      return;
    }
    let cancelled = false;
    const fetchRoom = async () => {
      try {
        const snap = await getDoc(doc(db, 'negotiations', roomId));
        if (!cancelled) {
          setDirectFetch(snap.exists() ? ({ id: snap.id, ...snap.data() } as Negotiation) : null);
        }
      } catch (e) {
        console.error('Direct room fetch failed:', e);
        if (!cancelled) setDirectFetch(null);
      }
    };
    fetchRoom();
    return () => { cancelled = true; };
  }, [negotiationFromContext, roomId]);

  const negotiation = negotiationFromContext ?? (directFetch !== 'loading' ? directFetch : null);
  const isResolving = !negotiationFromContext && directFetch === 'loading';

  // ── Per-room dedicated Firestore listeners ──────────────────────────────────
  // These bypass the context's bulk listener which can lag on freshly created rooms.
  // They feed local state that takes precedence over context-derived values.
  const [liveMessages, setLiveMessages] = useState<ChatMessage[] | null>(null);
  const [liveOffers, setLiveOffers] = useState<Offer[] | null>(null);
  const chatBottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!db || !roomId) return;

    // Subscribe to messages sub-collection directly for this room
    const msgsQuery = query(
      collection(db, 'negotiations', roomId, 'messages'),
      orderBy('createdAt', 'asc')
    );
    const unsubMsgs = onSnapshot(
      msgsQuery,
      (snap) => {
        const msgs: ChatMessage[] = [];
        snap.forEach((d) => msgs.push({ id: d.id, ...d.data() } as ChatMessage));
        setLiveMessages(msgs);
      },
      (err) => console.warn('Room messages listener error:', err)
    );

    // Subscribe to offers sub-collection directly for this room
    const offersQuery = query(
      collection(db, 'negotiations', roomId, 'offers'),
      orderBy('createdAt', 'asc')
    );
    const unsubOffers = onSnapshot(
      offersQuery,
      (snap) => {
        const offers: Offer[] = [];
        snap.forEach((d) => offers.push({ id: d.id, ...d.data() } as Offer));
        setLiveOffers(offers);
      },
      (err) => console.warn('Room offers listener error:', err)
    );

    return () => {
      unsubMsgs();
      unsubOffers();
    };
  }, [roomId]);

  // Auto-scroll chat to bottom when new messages arrive
  useEffect(() => {
    if (chatBottomRef.current) {
      chatBottomRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [liveMessages]);

  // Use live per-room data when available; fall back to context data
  const offers = liveOffers ?? getOffers(roomId || '');
  const messages = liveMessages ?? getMessages(roomId || '');
  const documents = getDocuments(roomId || '');

  // Active sub-view tab for the right rail: 'chat' | 'documents'
  const [activeRailTab, setActiveRailTab] = useState<'chat' | 'documents'>('chat');

  // Counteroffer form state
  const [isCountering, setIsCountering] = useState(false);
  const [counterAmount, setCounterAmount] = useState<number>(0);
  const [counterTerms, setCounterTerms] = useState('');
  const [paymentSchedule, setPaymentSchedule] = useState('Net 30 days');
  const [deliveryTimeline, setDeliveryTimeline] = useState('Within 10 business days');
  const [contingencies, setContingencies] = useState('Mutual standard non-disclosure applies.');
  const [isSubmittingOffer, setIsSubmittingOffer] = useState(false);

  // Chat message input
  const [chatInput, setChatInput] = useState('');
  const [isSendingMsg, setIsSendingMsg] = useState(false);

  // Confirmation modal states
  const [acceptConfirmOfferId, setAcceptConfirmOfferId] = useState<string | null>(null);

  if (isResolving) {
    return (
      <div className="p-12 flex flex-col items-center justify-center gap-4 min-h-[60vh]">
        <div className="w-10 h-10 border-4 border-slate-900 dark:border-teal-500 border-t-transparent rounded-full animate-spin" />
        <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">Provisioning Dealroom…</p>
        <p className="text-xs text-slate-400 dark:text-slate-500">Syncing with Firestore, this takes just a moment.</p>
      </div>
    );
  }

  if (!negotiation) {
    return (
      <div className="p-12 text-center">
        <AlertCircle className="w-12 h-12 text-slate-400 mx-auto mb-3" />
        <h2 className="text-xl font-bold text-slate-800 dark:text-white">Dealroom Not Found</h2>
        <p className="text-xs text-slate-500 mt-1">This negotiation room does not exist or you don't have access to it.</p>
        <Link to="/dashboard" className="mt-4 inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-slate-900 text-white text-xs font-semibold">
          <ArrowLeft className="w-3.5 h-3.5" /> Return to Dashboard
        </Link>
      </div>
    );
  }

  // Sorted offers (oldest first for narrative timeline)
  const chronologicalOffers = [...offers].sort(
    (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
  );
  const latestOffer = chronologicalOffers[chronologicalOffers.length - 1];

  const canAcceptOrCounter =
    latestOffer &&
    latestOffer.status === 'pending' &&
    latestOffer.fromUserId !== currentUser?.uid &&
    negotiation.status !== 'agreement_reached' &&
    negotiation.status !== 'closed';

  const handleOpenCounterForm = () => {
    setCounterAmount(latestOffer ? Math.round(latestOffer.amount * 0.95) : negotiation.currentAmount);
    setCounterTerms('');
    setIsCountering(true);
  };

  const handleSendCounteroffer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!counterAmount || !counterTerms.trim()) return;

    try {
      setIsSubmittingOffer(true);
      await submitCounteroffer(negotiation.id, {
        amount: Number(counterAmount),
        terms: counterTerms.trim(),
        paymentSchedule,
        deliveryTimeline,
        contingencies,
      });
      setIsCountering(false);
      setCounterTerms('');
    } catch (err) {
      console.error('Error submitting counteroffer:', err);
    } finally {
      setIsSubmittingOffer(false);
    }
  };

  const handleAcceptLatest = async () => {
    if (!latestOffer) return;
    try {
      await acceptOffer(negotiation.id, latestOffer.id);
      setAcceptConfirmOfferId(null);
      navigate(`/agreement/${negotiation.id}`);
    } catch (err) {
      console.error('Failed to accept offer:', err);
      alert('There was a problem accepting this offer. Please ensure you have the correct permissions.');
      setAcceptConfirmOfferId(null);
    }
  };

  const handleRejectLatest = async () => {
    if (!latestOffer) return;
    try {
      await rejectOffer(negotiation.id, latestOffer.id);
    } catch (err) {
      console.error('Failed to reject offer:', err);
      alert('There was a problem rejecting this offer.');
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim() || isSendingMsg) return;
    try {
      setIsSendingMsg(true);
      await sendMessage(negotiation.id, chatInput);
      setChatInput('');
    } catch (err) {
      console.error('Failed to send message:', err);
    } finally {
      setIsSendingMsg(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    await uploadDocument(negotiation.id, file);
    e.target.value = '';
  };

  return (
    <div className="flex-1 flex flex-col min-w-0 bg-slate-100 dark:bg-slate-950">
      {/* Top Header */}
      <div className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-4 sm:px-6 py-4">
        <div className="max-w-7xl mx-auto flex flex-col gap-4">
          {/* Breadcrumb & Title */}
          <div>
            <div className="flex flex-wrap items-center gap-2 mb-1">
              <Link
                to="/dashboard"
                className="inline-flex items-center gap-1 text-xs font-semibold text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 transition-colors"
              >
                <ArrowLeft className="w-3.5 h-3.5" /> Back to Rooms
              </Link>
              <span className="text-slate-300 dark:text-slate-600">/</span>
              <span className="text-xs font-mono text-slate-500 dark:text-slate-400 truncate max-w-[120px] sm:max-w-none">{negotiation.id}</span>
              <StatusBadge status={negotiation.status} />
            </div>

            <h1 className="text-lg sm:text-xl font-extrabold text-slate-950 dark:text-white tracking-tight">
              {negotiation.subject}
            </h1>

            <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 dark:text-slate-400 mt-1">
              <span className="flex items-center gap-1.5 font-medium text-slate-800 dark:text-slate-200">
                <Building2 className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500" />
                {negotiation.initiatorBusiness}
                <span className="text-slate-400 font-normal">vs</span>
                {negotiation.counterpartyBusiness}
              </span>
              <span>•</span>
              <span>Round {negotiation.totalRounds}</span>
              <span>•</span>
              <span className="text-slate-400 dark:text-slate-500">Target: {formatCurrency(negotiation.targetBudget || 0, negotiation.currency)}</span>
            </div>
          </div>

          {/* Current Position & Primary Actions — wraps on mobile */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="pr-3 border-r border-slate-200 dark:border-slate-700">
              <span className="text-[11px] uppercase font-bold text-slate-400 dark:text-slate-500 block">
                Current Position
              </span>
              <span className="text-xl font-extrabold text-slate-950 dark:text-white font-display">
                {formatCurrency(negotiation.currentAmount, negotiation.currency)}
              </span>
            </div>

            {/* If agreement reached, button to view and sign agreement */}
            {negotiation.status === 'agreement_reached' && (
              <Link
                to={`/agreement/${negotiation.id}`}
                className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-lg bg-teal-700 hover:bg-teal-800 text-white text-xs font-bold shadow-sm transition-all"
              >
                <FileCheck className="w-4 h-4" />
                Execute Agreement Summary
              </Link>
            )}

            {/* If pending counteroffer and current user's turn — wraps cleanly on mobile */}
            {canAcceptOrCounter && (
              <div className="flex flex-wrap items-center gap-2">
                <button
                  onClick={() => setAcceptConfirmOfferId(latestOffer.id)}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-teal-700 hover:bg-teal-800 text-white text-xs font-bold shadow-sm transition-colors"
                >
                  <CheckCircle className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Accept</span> ({formatCurrency(latestOffer.amount, latestOffer.currency)})
                </button>
                <button
                  onClick={handleOpenCounterForm}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold shadow-sm transition-colors"
                >
                  <Sparkles className="w-3.5 h-3.5 text-teal-400" />
                  Counter
                </button>
                <button
                  onClick={handleRejectLatest}
                  className="inline-flex items-center gap-1.5 p-2 rounded-lg border border-slate-300 dark:border-slate-700 hover:bg-rose-50 dark:hover:bg-rose-950/30 hover:border-rose-200 dark:hover:border-rose-800 text-slate-600 dark:text-slate-300 hover:text-rose-600 transition-colors"
                  title="Decline Offer"
                >
                  <XCircle className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Main Split Grid (Main Timeline + Decision Support on Left; Chat & Docs on Right) */}
      <div className="max-w-7xl mx-auto w-full p-4 sm:p-6 lg:p-8 flex-1 grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* LEFT COLUMN: Timeline & Decision Support (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          {/* Decision Support Analytics Box */}
          <DecisionSupportPanel negotiation={negotiation} offers={chronologicalOffers} />

          {/* Counteroffer Submission Drawer Form */}
          {isCountering && (
            <div className="bg-white dark:bg-slate-900 rounded-xl border-2 border-teal-600 dark:border-teal-500 p-5 shadow-elevated animate-in fade-in slide-in-from-top-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800 mb-4">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-md bg-teal-100 dark:bg-teal-900 text-teal-800 dark:text-teal-300 flex items-center justify-center font-bold text-xs">
                    R{offers.length + 1}
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                      Draft Counteroffer (Round {offers.length + 1})
                    </h3>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">
                      Submitting on behalf of {currentUser?.businessName}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setIsCountering(false)}
                  className="text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 font-semibold"
                >
                  Cancel
                </button>
              </div>

              <form onSubmit={handleSendCounteroffer} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                    Counteroffer Monetary Figure ({negotiation.currency || 'NGN'})
                  </label>
                  <div className="relative">
                    <span className="absolute left-3.5 top-2 text-slate-400 font-bold">₦</span>
                    <input
                      type="number"
                      value={counterAmount}
                      onChange={(e) => setCounterAmount(Number(e.target.value))}
                      className="w-full pl-8 pr-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm font-bold focus:ring-2 focus:ring-teal-600 focus:outline-none"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                    Revised Terms &amp; Concession Rationale
                  </label>
                  <textarea
                    rows={3}
                    value={counterTerms}
                    onChange={(e) => setCounterTerms(e.target.value)}
                    placeholder="Outline your adjusted service levels, deliverable milestones, or reason for this financial counter..."
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs focus:ring-2 focus:ring-teal-600 focus:outline-none"
                    required
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wider mb-1">
                      Payment Schedule
                    </label>
                    <input
                      type="text"
                      value={paymentSchedule}
                      onChange={(e) => setPaymentSchedule(e.target.value)}
                      className="w-full px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wider mb-1">
                      Delivery Timeline
                    </label>
                    <input
                      type="text"
                      value={deliveryTimeline}
                      onChange={(e) => setDeliveryTimeline(e.target.value)}
                      className="w-full px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs"
                    />
                  </div>
                </div>

                <div className="pt-2 flex items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setIsCountering(false)}
                    className="px-3 py-1.5 text-xs text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-md"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmittingOffer}
                    className="px-4 py-2 rounded-lg bg-teal-700 hover:bg-teal-800 text-white text-xs font-bold shadow-sm transition-colors"
                  >
                    {isSubmittingOffer ? 'Submitting...' : 'Dispatch Binding Counteroffer'}
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Offer & Counteroffer Timeline */}
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-card overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-950/50 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Layers className="w-4 h-4 text-slate-600 dark:text-slate-400" />
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">Offer &amp; Counteroffer Timeline</h3>
              </div>
              <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                {chronologicalOffers.length} {chronologicalOffers.length === 1 ? 'Iteration' : 'Iterations'} Logged
              </span>
            </div>

            <div className="p-5 space-y-6">
              {chronologicalOffers.length === 0 && (
                <div className="text-center py-8 text-slate-400 dark:text-slate-500 text-xs">
                  No offers yet — offers will appear here in real-time.
                </div>
              )}
              {chronologicalOffers.map((offer, index) => {
                const isMyOffer = offer.fromUserId === currentUser?.uid;
                const isLatest = index === chronologicalOffers.length - 1;

                return (
                  <div
                    key={offer.id}
                    className={`relative pl-7 pb-6 last:pb-0 ${
                      !isLatest ? 'border-l-2 border-slate-200 dark:border-slate-700 ml-3.5' : 'ml-3.5'
                    }`}
                  >
                    {/* Circle marker */}
                    <div
                      className={`absolute -left-[15px] top-0 w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shadow-sm ${
                        offer.status === 'accepted'
                          ? 'bg-emerald-600 text-white'
                          : offer.status === 'pending'
                          ? 'bg-amber-500 text-white'
                          : 'bg-slate-800 text-slate-200'
                      }`}
                    >
                      R{offer.round}
                    </div>

                    <div
                      className={`p-4 rounded-xl border transition-all ${
                        isLatest && offer.status === 'pending'
                          ? 'bg-amber-50/40 dark:bg-amber-950/20 border-amber-300 dark:border-amber-800 ring-1 ring-amber-300/60 shadow-sm'
                          : offer.status === 'accepted'
                          ? 'bg-teal-50/40 dark:bg-teal-950/20 border-teal-300 dark:border-teal-800 shadow-sm'
                          : 'bg-slate-50/70 dark:bg-slate-800/40 border-slate-200 dark:border-slate-700'
                      }`}
                    >
                      {/* Offer Header */}
                      <div className="flex flex-wrap items-center justify-between gap-2 pb-2.5 border-b border-slate-200/70 dark:border-slate-700/70">
                        <div>
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="text-xs font-bold text-slate-900 dark:text-white">
                              {offer.fromUserName}
                            </span>
                            <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                              ({offer.fromBusinessName})
                            </span>
                            {isMyOffer && (
                              <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 font-semibold">
                                You
                              </span>
                            )}
                          </div>
                          <span className="text-[10px] text-slate-400 dark:text-slate-500">
                            {formatDate(offer.createdAt)}
                          </span>
                        </div>

                        <div className="flex items-center gap-2">
                          <span className="text-lg font-bold text-slate-950 dark:text-white font-display">
                            {formatCurrency(offer.amount, offer.currency)}
                          </span>
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                              offer.status === 'accepted'
                                ? 'bg-emerald-100 text-emerald-800'
                                : offer.status === 'countered'
                                ? 'bg-slate-200 text-slate-700'
                                : offer.status === 'pending'
                                ? 'bg-amber-100 text-amber-800 animate-pulse'
                                : 'bg-rose-100 text-rose-800'
                            }`}
                          >
                            {offer.status}
                          </span>
                        </div>
                      </div>

                      {/* Offer Body */}
                      <div className="mt-3 space-y-2 text-xs text-slate-700">
                        <div>
                          <span className="font-semibold text-slate-900 block mb-0.5">
                            Proposed Terms:
                          </span>
                          <p className="leading-relaxed bg-white/80 p-2.5 rounded border border-slate-200/80">
                            {offer.terms}
                          </p>
                        </div>

                        {(offer.paymentSchedule || offer.deliveryTimeline) && (
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] text-slate-600 pt-1">
                            {offer.paymentSchedule && (
                              <div>
                                <span className="font-semibold text-slate-800">Schedule:</span>{' '}
                                {offer.paymentSchedule}
                              </div>
                            )}
                            {offer.deliveryTimeline && (
                              <div>
                                <span className="font-semibold text-slate-800">Timeline:</span>{' '}
                                {offer.deliveryTimeline}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: Scoped Live Chat & Document Vault (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          {/* Tab buttons: Chat vs Documents */}
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-card overflow-hidden">
            <div className="flex border-b border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-950/50">
              <button
                onClick={() => setActiveRailTab('chat')}
                className={`flex-1 py-3 px-4 text-xs font-bold flex items-center justify-center gap-2 transition-colors ${
                  activeRailTab === 'chat'
                    ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white border-b-2 border-teal-600'
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
                }`}
              >
                <MessageSquare className="w-4 h-4 text-teal-600" />
                Live Chat ({messages.length})
              </button>
              <button
                onClick={() => setActiveRailTab('documents')}
                className={`flex-1 py-3 px-4 text-xs font-bold flex items-center justify-center gap-2 transition-colors ${
                  activeRailTab === 'documents'
                    ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white border-b-2 border-teal-600'
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
                }`}
              >
                <Paperclip className="w-4 h-4 text-teal-600" />
                Documents ({documents.length})
              </button>
            </div>

            {/* TAB CONTENT: CHAT */}
            {activeRailTab === 'chat' && (
              <div className="flex flex-col h-[480px] sm:h-[520px]">
                {/* Messages Transcript */}
                <div className="flex-1 p-4 overflow-y-auto space-y-3.5 bg-slate-50/40 dark:bg-slate-950/30">
                  {messages.length === 0 && (
                    <div className="h-full flex items-center justify-center text-xs text-slate-400 dark:text-slate-500 text-center px-4">
                      No messages yet. Be the first to send a message in this dealroom.
                    </div>
                  )}
                  {messages.map((msg) => {
                    const isMe = msg.senderId === currentUser?.uid;

                    if (msg.isSystemEvent) {
                      return (
                        <div key={msg.id} className="text-center my-2">
                          <span className="inline-block px-3 py-1 rounded-full bg-slate-200/90 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-[11px] font-medium border border-slate-300/60 dark:border-slate-700 shadow-subtle">
                            {msg.text}
                          </span>
                        </div>
                      );
                    }

                    return (
                      <div
                        key={msg.id}
                        className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}
                      >
                        <div className="flex items-center gap-1.5 mb-0.5 text-[11px] text-slate-500 dark:text-slate-400">
                          <span className="font-semibold text-slate-700 dark:text-slate-300">{msg.senderName}</span>
                          <span>•</span>
                          <span>{formatRelativeTime(msg.createdAt)}</span>
                        </div>
                        <div
                          className={`max-w-[85%] rounded-2xl px-3.5 py-2 text-xs shadow-sm leading-relaxed ${
                            isMe
                              ? 'bg-slate-900 dark:bg-teal-800 text-white rounded-br-none'
                              : 'bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 border border-slate-200 dark:border-slate-700 rounded-bl-none'
                          }`}
                          dangerouslySetInnerHTML={{ __html: sanitizeText(msg.text) }}
                        />
                      </div>
                    );
                  })}
                  {/* Scroll anchor */}
                  <div ref={chatBottomRef} />
                </div>

                {/* Chat Input */}
                <form
                  onSubmit={handleSendMessage}
                  className="p-3 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex items-center gap-2"
                >
                  <input
                    type="text"
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    placeholder="Type message to room participants..."
                    className="flex-1 px-3 py-2 text-xs border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white rounded-lg focus:ring-2 focus:ring-teal-600 focus:outline-none min-w-0"
                    disabled={isSendingMsg}
                  />
                  <button
                    type="submit"
                    disabled={isSendingMsg || !chatInput.trim()}
                    className="p-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex-shrink-0"
                  >
                    <Send className="w-4 h-4 text-teal-400" />
                  </button>
                </form>
              </div>
            )}

            {/* TAB CONTENT: DOCUMENTS */}
            {activeRailTab === 'documents' && (
              <div className="p-4 space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                  <div>
                    <h4 className="text-xs font-bold text-slate-900 dark:text-white">Contract Attachments</h4>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">
                      Upload specifications, master terms, or compliance checklists
                    </p>
                  </div>

                  <div className="flex flex-col items-end gap-2">
                    <label className="cursor-pointer inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900 dark:bg-teal-700 hover:bg-slate-800 dark:hover:bg-teal-600 text-white text-xs font-semibold shadow-sm transition-colors">
                      <Upload className="w-3.5 h-3.5 text-teal-400 dark:text-white" />
                      Upload File
                      <input type="file" onChange={handleFileUpload} className="hidden" />
                    </label>
                    <span className="text-[9px] font-semibold text-slate-400 flex items-center gap-1">
                      Powered by Cloudinary
                    </span>
                  </div>
                </div>

                {documents.length === 0 ? (
                  <div className="py-8 text-center text-slate-400 dark:text-slate-500 text-xs">
                    No documents uploaded yet in this room.
                  </div>
                ) : (
                  <div className="space-y-2">
                    {documents.map((doc) => (
                      <div
                        key={doc.id}
                        className="p-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50/70 dark:bg-slate-800/40 flex items-center justify-between gap-3 hover:bg-white dark:hover:bg-slate-800 transition-colors"
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div className="w-8 h-8 rounded-lg bg-teal-100 text-teal-800 flex items-center justify-center flex-shrink-0">
                            <FileText className="w-4 h-4" />
                          </div>
                          <div className="min-w-0">
                            <div className="text-xs font-bold text-slate-900 truncate">
                              {doc.fileName}
                            </div>
                            <div className="text-[10px] text-slate-500">
                              By {doc.uploaderName} • {(doc.fileSize / 1024).toFixed(1)} KB
                            </div>
                          </div>
                        </div>

                        <a
                          href={doc.fileData || doc.downloadUrl || `data:text/plain;charset=utf-8,Verified contract record for ${encodeURIComponent(doc.fileName)}`}
                          download={doc.fileName}
                          className="p-1.5 rounded text-slate-400 hover:text-slate-800 hover:bg-slate-200 transition-colors flex-shrink-0"
                          title="Download Document"
                        >
                          <Download className="w-4 h-4" />
                        </a>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Confirmation Modal for Accepting Offer */}
      {acceptConfirmOfferId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 rounded-xl max-w-md w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800">
            <div className="w-10 h-10 rounded-full bg-teal-100 dark:bg-teal-900 text-teal-800 dark:text-teal-300 flex items-center justify-center mb-3 font-bold">
              <CheckCircle className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-slate-950 dark:text-white">
              Confirm Bilateral Term Acceptance
            </h3>
            <p className="text-xs text-slate-600 dark:text-slate-400 mt-1.5 leading-relaxed">
              Accepting this offer of{' '}
              <strong className="text-slate-900 dark:text-white font-bold">
                {formatCurrency(latestOffer?.amount || 0, latestOffer?.currency)}
              </strong>{' '}
              will freeze further counteroffers and generate the formal Agreement Summary for digital signature.
            </p>

            <div className="mt-5 flex items-center justify-end gap-2.5">
              <button
                onClick={() => setAcceptConfirmOfferId(null)}
                className="px-3.5 py-2 rounded-lg text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                Cancel
              </button>
              <button
                onClick={handleAcceptLatest}
                className="px-4 py-2 rounded-lg bg-teal-700 hover:bg-teal-800 text-white text-xs font-bold shadow-sm"
              >
                Confirm &amp; Proceed to Execution
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
