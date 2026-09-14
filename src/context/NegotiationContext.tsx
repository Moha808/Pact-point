import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  Negotiation,
  Offer,
  ChatMessage,
  NegotiationDocument,
  Agreement,
  NegotiationStatus,
  AgreementSignature,
} from '../types';
import { db } from '../lib/firebase';
import { uploadToCloudinary } from '../lib/cloudinary';
import {
  collection,
  doc,
  setDoc,
  updateDoc,
  onSnapshot,
  query,
  orderBy,
  addDoc,
  getDocs,
  getDoc,
  where,
} from 'firebase/firestore';
import { useAuth } from './AuthContext';

interface CreateNegotiationInput {
  subject: string;
  category: string;
  description: string;
  counterpartyId: string;
  counterpartyName: string;
  counterpartyBusiness: string;
  initialAmount: number;
  currency: string;
  initialTerms: string;
  paymentSchedule?: string;
  deliveryTimeline?: string;
  contingencies?: string;
}

interface CounterofferInput {
  amount: number;
  terms: string;
  paymentSchedule?: string;
  deliveryTimeline?: string;
  contingencies?: string;
}

interface NegotiationContextType {
  negotiations: Negotiation[];
  loading: boolean;
  getNegotiation: (id: string) => Negotiation | undefined;
  getOffers: (negotiationId: string) => Offer[];
  getMessages: (negotiationId: string) => ChatMessage[];
  getDocuments: (negotiationId: string) => NegotiationDocument[];
  getAgreement: (negotiationId: string) => Agreement | undefined;
  createNegotiation: (input: CreateNegotiationInput) => Promise<string>;
  submitCounteroffer: (negotiationId: string, input: CounterofferInput) => Promise<void>;
  acceptOffer: (negotiationId: string, offerId: string) => Promise<void>;
  rejectOffer: (negotiationId: string, offerId: string) => Promise<void>;
  sendMessage: (negotiationId: string, text: string) => Promise<void>;
  uploadDocument: (negotiationId: string, file: File) => Promise<void>;
  signAgreement: (negotiationId: string, signature: AgreementSignature) => Promise<void>;
  updateNegotiationStatus: (negotiationId: string, status: NegotiationStatus) => Promise<void>;
}

const NegotiationContext = createContext<NegotiationContextType | undefined>(undefined);

export const NegotiationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { currentUser } = useAuth();
  const [loading, setLoading] = useState(true);

  // Real data state (starts completely empty, synced with Firestore)
  const [negotiations, setNegotiations] = useState<Negotiation[]>([]);
  const [offersMap, setOffersMap] = useState<Record<string, Offer[]>>({});
  const [messagesMap, setMessagesMap] = useState<Record<string, ChatMessage[]>>({});
  const [documentsMap, setDocumentsMap] = useState<Record<string, NegotiationDocument[]>>({});
  const [agreementsMap, setAgreementsMap] = useState<Record<string, Agreement>>({});

  // 1. Listen to real Firestore Negotiations collection — filtered by participant
  //    Uses 'participants' array-contains so each user only receives their own rooms.
  //    Falls back to a full collection scan if currentUser is not yet loaded.
  useEffect(() => {
    if (!db) {
      setLoading(false);
      return;
    }

    // Wait until we know who the user is before subscribing
    if (!currentUser) {
      setLoading(false);
      return;
    }

    try {
      // Admins need to see all rooms. The rules allow them to query the entire collection.
      const q = currentUser.role === 'admin'
        ? query(collection(db, 'negotiations'))
        : query(collection(db, 'negotiations'), where('participants', 'array-contains', currentUser.uid));

      const unsubscribe = onSnapshot(
        q,
        (snapshot) => {
          const list: Negotiation[] = [];
          const now = Date.now();
          const EXPIRATION_MS = 24 * 60 * 60 * 1000; // 24 hours
          
          snapshot.forEach((d) => {
            const data = d.data() as Omit<Negotiation, 'id'>;
            let status = data.status;
            
            // Lazy expiration check
            if ((status === 'open' || status === 'countered') && data.updatedAt) {
              if (now - new Date(data.updatedAt).getTime() > EXPIRATION_MS) {
                status = 'closed';
                // Fire and forget status update to DB
                updateDoc(doc(db, 'negotiations', d.id), { status: 'closed' }).catch(() => {});
              }
            }
            
            list.push({ id: d.id, ...data, status } as Negotiation);
          });
          // Sort in memory to avoid requiring a composite index
          list.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
          setNegotiations(list);
          setLoading(false);
        },
        (error) => {
          console.warn('Firestore negotiations listener notice:', error);
          setLoading(false);
        }
      );

      return () => unsubscribe();
    } catch (e) {
      console.warn('Could not initialize negotiations query:', e);
      setLoading(false);
    }
  }, [currentUser]);

  // 2. Realtime listeners for active room subcollections (Offers, Messages, Documents, Agreements)
  //    Only attach for rooms that are in the current user's list, and only when the list is populated.
  useEffect(() => {
    if (!db || negotiations.length === 0) return;

    const unsubs: (() => void)[] = [];

    negotiations.forEach((neg) => {
      // Subcollection: Offers
      const offersQuery = query(
        collection(db, 'negotiations', neg.id, 'offers'),
        orderBy('createdAt', 'asc')
      );
      const unsubOffers = onSnapshot(offersQuery, (snap) => {
        const offers: Offer[] = [];
        snap.forEach((d) => offers.push({ id: d.id, ...d.data() } as Offer));
        setOffersMap((prev) => ({ ...prev, [neg.id]: offers }));
      });
      unsubs.push(unsubOffers);

      // Subcollection: Messages
      const msgsQuery = query(
        collection(db, 'negotiations', neg.id, 'messages'),
        orderBy('createdAt', 'asc')
      );
      const unsubMsgs = onSnapshot(msgsQuery, (snap) => {
        const msgs: ChatMessage[] = [];
        snap.forEach((d) => msgs.push({ id: d.id, ...d.data() } as ChatMessage));
        setMessagesMap((prev) => ({ ...prev, [neg.id]: msgs }));
      });
      unsubs.push(unsubMsgs);

      // Subcollection: Documents
      const docsQuery = query(
        collection(db, 'negotiations', neg.id, 'documents'),
        orderBy('createdAt', 'desc')
      );
      const unsubDocs = onSnapshot(docsQuery, (snap) => {
        const docsList: NegotiationDocument[] = [];
        snap.forEach((d) => docsList.push({ id: d.id, ...d.data() } as NegotiationDocument));
        setDocumentsMap((prev) => ({ ...prev, [neg.id]: docsList }));
      });
      unsubs.push(unsubDocs);

      // Collection: Agreements
      const unsubAgreements = onSnapshot(doc(db, 'agreements', neg.id), (snap) => {
        if (snap.exists()) {
          setAgreementsMap((prev) => ({ ...prev, [neg.id]: snap.data() as Agreement }));
        }
      });
      unsubs.push(unsubAgreements);
    });

    return () => {
      unsubs.forEach((u) => u());
    };
  }, [negotiations]);

  const getNegotiation = (id: string) => negotiations.find((n) => n.id === id);
  const getOffers = (negotiationId: string) => offersMap[negotiationId] || [];
  const getMessages = (negotiationId: string) => messagesMap[negotiationId] || [];
  const getDocuments = (negotiationId: string) => documentsMap[negotiationId] || [];
  const getAgreement = (negotiationId: string) => agreementsMap[negotiationId];

  const createNegotiation = async (input: CreateNegotiationInput): Promise<string> => {
    if (!currentUser) throw new Error('You must be authenticated to open a dealroom');
    if (!db) throw new Error('Database connection not established');

    const newId = 'neg-' + Date.now();
    const offerId = 'off-' + Date.now();

    const newNegotiation: Negotiation = {
      id: newId,
      subject: input.subject,
      category: input.category,
      description: input.description,
      initiatorId: currentUser.uid,
      initiatorName: currentUser.fullName,
      initiatorBusiness: currentUser.businessName,
      counterpartyId: input.counterpartyId,
      counterpartyName: input.counterpartyName,
      counterpartyBusiness: input.counterpartyBusiness,
      // participants array enables Firestore 'array-contains' queries for both parties
      participants: [currentUser.uid, input.counterpartyId],
      targetBudget: input.initialAmount * 1.1,
      currency: input.currency || 'USD',
      status: 'open',
      currentAmount: input.initialAmount,
      currentOfferId: offerId,
      lastOfferBy: currentUser.uid,
      totalRounds: 1,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      isFlagged: false,
    };

    const initialOffer: Offer = {
      id: offerId,
      negotiationId: newId,
      fromUserId: currentUser.uid,
      fromUserName: currentUser.fullName,
      fromBusinessName: currentUser.businessName,
      amount: input.initialAmount,
      currency: input.currency || 'USD',
      terms: input.initialTerms,
      paymentSchedule: input.paymentSchedule || 'Standard 30 days',
      deliveryTimeline: input.deliveryTimeline || 'Standard delivery',
      contingencies: input.contingencies,
      type: 'offer',
      status: 'pending',
      createdAt: new Date().toISOString(),
      round: 1,
    };

    const initialMessage: ChatMessage = {
      id: 'msg-' + Date.now(),
      negotiationId: newId,
      senderId: 'system',
      senderName: 'System',
      senderRole: 'admin',
      isSystemEvent: true,
      text: `Dealroom established. Opening offer of ₦${input.initialAmount.toLocaleString()} submitted by ${currentUser.fullName} (${currentUser.businessName}).`,
      createdAt: new Date().toISOString(),
    };

    // Write negotiation + initial offer + initial message
    await setDoc(doc(db, 'negotiations', newId), newNegotiation);
    await setDoc(doc(db, 'negotiations', newId, 'offers', offerId), initialOffer);
    await addDoc(collection(db, 'negotiations', newId, 'messages'), initialMessage);

    // Notify the counterparty by writing a notification record under their UID
    try {
      await setDoc(doc(db, 'notifications', input.counterpartyId, 'rooms', newId), {
        negotiationId: newId,
        subject: input.subject,
        initiatorName: currentUser.fullName,
        initiatorBusiness: currentUser.businessName,
        amount: input.initialAmount,
        currency: input.currency || 'NGN',
        createdAt: new Date().toISOString(),
        read: false,
      });
    } catch (notifErr) {
      // Non-fatal — room was created successfully; notification is best-effort
      console.warn('Could not write counterparty notification:', notifErr);
    }

    return newId;
  };

  const submitCounteroffer = async (negotiationId: string, input: CounterofferInput) => {
    if (!currentUser) throw new Error('Not authenticated');
    if (!db) throw new Error('Database not connected');

    const neg = getNegotiation(negotiationId);
    if (!neg) throw new Error('Negotiation not found');

    const currentOffers = getOffers(negotiationId);
    const newRound = currentOffers.length + 1;
    const newOfferId = 'off-' + Date.now();

    const newOffer: Offer = {
      id: newOfferId,
      negotiationId,
      fromUserId: currentUser.uid,
      fromUserName: currentUser.fullName,
      fromBusinessName: currentUser.businessName,
      amount: input.amount,
      currency: neg.currency,
      terms: input.terms,
      paymentSchedule: input.paymentSchedule,
      deliveryTimeline: input.deliveryTimeline,
      contingencies: input.contingencies,
      type: 'counteroffer',
      status: 'pending',
      createdAt: new Date().toISOString(),
      round: newRound,
    };

    // Mark previous pending offers as countered in Firestore
    const pendingSnap = await getDocs(
      query(collection(db, 'negotiations', negotiationId, 'offers'), where('status', '==', 'pending'))
    );
    for (const offDoc of pendingSnap.docs) {
      await updateDoc(doc(db, 'negotiations', negotiationId, 'offers', offDoc.id), {
        status: 'countered',
      });
    }

    await setDoc(doc(db, 'negotiations', negotiationId, 'offers', newOfferId), newOffer);

    await updateDoc(doc(db, 'negotiations', negotiationId), {
      status: 'countered',
      currentAmount: input.amount,
      currentOfferId: newOfferId,
      lastOfferBy: currentUser.uid,
      totalRounds: newRound,
      updatedAt: new Date().toISOString(),
    });

    const sysMsg: ChatMessage = {
      id: 'msg-' + Date.now(),
      negotiationId,
      senderId: 'system',
      senderName: 'System',
      senderRole: 'admin',
      isSystemEvent: true,
      text: `Round ${newRound}: Counteroffer of ₦${input.amount.toLocaleString()} submitted by ${currentUser.fullName} (${currentUser.businessName}).`,
      createdAt: new Date().toISOString(),
    };

    await addDoc(collection(db, 'negotiations', negotiationId, 'messages'), sysMsg);
  };

  const acceptOffer = async (negotiationId: string, offerId: string) => {
    if (!currentUser || !db) return;
    const neg = getNegotiation(negotiationId);
    if (!neg) return;

    let acceptedOffer = getOffers(negotiationId).find((o) => o.id === offerId);
    
    // If context state is stale, fetch directly
    if (!acceptedOffer) {
      const snap = await getDoc(doc(db, 'negotiations', negotiationId, 'offers', offerId));
      if (snap.exists()) {
        acceptedOffer = { id: snap.id, ...snap.data() } as Offer;
      }
    }

    if (!acceptedOffer) {
      console.error("Could not locate the accepted offer details");
      return;
    }

    const agreementId = 'agr-' + Date.now();
    const newAgreement: Agreement = {
      negotiationId,
      agreementNumber: `AGR-${Date.now().toString().slice(-6)}`,
      title: `${neg.subject} — Final Commercial Contract`,
      finalAmount: acceptedOffer.amount,
      currency: acceptedOffer.currency || 'NGN',
      finalTerms: acceptedOffer.terms,
      paymentSchedule: acceptedOffer.paymentSchedule || 'Net 30 days',
      deliveryTimeline: acceptedOffer.deliveryTimeline || 'Standard milestone schedule',
      contingencies: acceptedOffer.contingencies || 'Standard mutual confidentiality & warranty applies.',
      acceptedOfferId: offerId,
      status: 'pending_signatures',
      createdAt: new Date().toISOString(),
    };

    await updateDoc(doc(db, 'negotiations', negotiationId), {
      status: 'agreement_reached',
      agreementId,
      updatedAt: new Date().toISOString(),
    });

    await updateDoc(doc(db, 'negotiations', negotiationId, 'offers', offerId), {
      status: 'accepted',
    });

    await setDoc(doc(db, 'agreements', negotiationId), newAgreement);

    const sysMsg: ChatMessage = {
      id: 'msg-' + Date.now(),
      negotiationId,
      senderId: 'system',
      senderName: 'System',
      senderRole: 'admin',
      isSystemEvent: true,
      text: `Offer of ₦${acceptedOffer.amount.toLocaleString()} was ACCEPTED by ${currentUser.fullName}. Agreement draft generated and ready for digital execution.`,
      createdAt: new Date().toISOString(),
    };

    await addDoc(collection(db, 'negotiations', negotiationId, 'messages'), sysMsg);
  };

  const rejectOffer = async (negotiationId: string, offerId: string) => {
    if (!currentUser || !db) return;
    const neg = getNegotiation(negotiationId);
    if (!neg) return;

    await updateDoc(doc(db, 'negotiations', negotiationId), {
      status: 'rejected',
      updatedAt: new Date().toISOString(),
    });

    await updateDoc(doc(db, 'negotiations', negotiationId, 'offers', offerId), {
      status: 'rejected',
    });

    const sysMsg: ChatMessage = {
      id: 'msg-' + Date.now(),
      negotiationId,
      senderId: 'system',
      senderName: 'System',
      senderRole: 'admin',
      isSystemEvent: true,
      text: `Offer was rejected by ${currentUser.fullName}. A counteroffer or revised terms may be submitted.`,
      createdAt: new Date().toISOString(),
    };

    await addDoc(collection(db, 'negotiations', negotiationId, 'messages'), sysMsg);
  };

  const sendMessage = async (negotiationId: string, text: string) => {
    if (!currentUser || !db || !text.trim()) return;

    const newMsg: ChatMessage = {
      id: 'msg-' + Date.now(),
      negotiationId,
      senderId: currentUser.uid,
      senderName: currentUser.fullName,
      senderRole: currentUser.role,
      text: text.trim(),
      createdAt: new Date().toISOString(),
    };

    await addDoc(collection(db, 'negotiations', negotiationId, 'messages'), newMsg);
  };

  const uploadDocument = async (negotiationId: string, file: File) => {
    if (!currentUser || !db) return;

    // Upload to Cloudinary (or fallback base64 if Cloudinary keys are empty)
    const uploadResult = await uploadToCloudinary(file);

    const newDoc: NegotiationDocument = {
      id: 'doc-' + Date.now(),
      negotiationId,
      uploadedBy: currentUser.uid,
      uploaderName: currentUser.fullName,
      fileName: file.name,
      fileSize: uploadResult.bytes || file.size,
      fileType: file.type || 'application/octet-stream',
      downloadUrl: uploadResult.url,
      fileData: uploadResult.url,
      createdAt: new Date().toISOString(),
    };

    await addDoc(collection(db, 'negotiations', negotiationId, 'documents'), newDoc);

    const sysMsg: ChatMessage = {
      id: 'msg-' + Date.now(),
      negotiationId,
      senderId: 'system',
      senderName: 'System',
      senderRole: 'admin',
      isSystemEvent: true,
      text: `Document uploaded: "${file.name}" (${(file.size / 1024).toFixed(1)} KB) by ${currentUser.fullName}.`,
      createdAt: new Date().toISOString(),
    };

    await addDoc(collection(db, 'negotiations', negotiationId, 'messages'), sysMsg);
  };

  const signAgreement = async (negotiationId: string, signature: AgreementSignature) => {
    if (!db) return;
    let existing = agreementsMap[negotiationId];
    
    // If not in local context, fetch directly
    if (!existing) {
      const snap = await getDoc(doc(db, 'agreements', negotiationId));
      if (snap.exists()) {
        existing = snap.data() as Agreement;
      }
    }
    
    if (!existing) {
      throw new Error("Could not locate the agreement record to sign.");
    }

    const neg = getNegotiation(negotiationId);
    const isInitiator = neg ? signature.userId === neg.initiatorId : true;

    const updatedAgreement: Agreement = {
      ...existing,
      initiatorSignature: isInitiator ? signature : existing.initiatorSignature,
      counterpartySignature: !isInitiator ? signature : existing.counterpartySignature,
    };

    if (
      (updatedAgreement.initiatorSignature || isInitiator) &&
      (updatedAgreement.counterpartySignature || !isInitiator)
    ) {
      updatedAgreement.status = 'fully_executed';
      updatedAgreement.executedAt = new Date().toISOString();
    }

    await setDoc(doc(db, 'agreements', negotiationId), updatedAgreement);

    const sysMsg: ChatMessage = {
      id: 'msg-' + Date.now(),
      negotiationId,
      senderId: 'system',
      senderName: 'System',
      senderRole: 'admin',
      isSystemEvent: true,
      text: `Agreement executed digitally by ${signature.fullName} (${signature.businessName}) on ${new Date().toLocaleDateString()}.`,
      createdAt: new Date().toISOString(),
    };

    await addDoc(collection(db, 'negotiations', negotiationId, 'messages'), sysMsg);
  };

  const updateNegotiationStatus = async (negotiationId: string, status: NegotiationStatus) => {
    if (!db) return;
    await updateDoc(doc(db, 'negotiations', negotiationId), {
      status,
      updatedAt: new Date().toISOString(),
    });
  };

  return (
    <NegotiationContext.Provider
      value={{
        negotiations,
        loading,
        getNegotiation,
        getOffers,
        getMessages,
        getDocuments,
        getAgreement,
        createNegotiation,
        submitCounteroffer,
        acceptOffer,
        rejectOffer,
        sendMessage,
        uploadDocument,
        signAgreement,
        updateNegotiationStatus,
      }}
    >
      {children}
    </NegotiationContext.Provider>
  );
};

export const useNegotiation = () => {
  const context = useContext(NegotiationContext);
  if (!context) {
    throw new Error('useNegotiation must be used within a NegotiationProvider');
  }
  return context;
};
