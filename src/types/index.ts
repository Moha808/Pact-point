export type UserRole = 'owner' | 'negotiator' | 'admin' | 'observer';

export interface UserProfile {
  uid: string;
  fullName: string;
  businessName: string;
  email: string;
  username: string;
  phone: string;
  role: UserRole;
  avatarUrl?: string;
  createdAt: string;
  status: 'active' | 'suspended';
}

export type NegotiationStatus =
  | 'open'
  | 'countered'
  | 'accepted'
  | 'rejected'
  | 'agreement_reached'
  | 'closed';

export interface NegotiationParty {
  uid: string;
  name: string;
  businessName: string;
  role: 'initiator' | 'counterparty';
  userRole: UserRole;
  avatarUrl?: string;
}

export interface Offer {
  id: string;
  negotiationId: string;
  fromUserId: string;
  fromUserName: string;
  fromBusinessName: string;
  amount: number;
  currency: string;
  terms: string;
  paymentSchedule?: string;
  deliveryTimeline?: string;
  contingencies?: string;
  type: 'offer' | 'counteroffer';
  status: 'pending' | 'countered' | 'accepted' | 'rejected' | 'superseded';
  createdAt: string;
  round: number;
}

export interface ChatMessage {
  id: string;
  negotiationId: string;
  senderId: string;
  senderName: string;
  senderRole: UserRole;
  text: string;
  isSystemEvent?: boolean;
  createdAt: string;
}

export interface NegotiationDocument {
  id: string;
  negotiationId: string;
  uploadedBy: string;
  uploaderName: string;
  fileName: string;
  fileSize: number;
  fileType: string;
  storagePath?: string;
  downloadUrl?: string;
  fileData?: string;
  createdAt: string;
}

export interface AgreementSignature {
  userId: string;
  fullName: string;
  email: string;
  typedSignature: string;
  title: string;
  businessName: string;
  signedAt: string;
  ipAddress?: string;
  signatureId: string;
}

export interface Agreement {
  negotiationId: string;
  agreementNumber: string;
  title: string;
  finalAmount: number;
  currency: string;
  finalTerms: string;
  paymentSchedule: string;
  deliveryTimeline: string;
  contingencies: string;
  acceptedOfferId: string;
  initiatorSignature?: AgreementSignature;
  counterpartySignature?: AgreementSignature;
  status: 'draft' | 'pending_signatures' | 'fully_executed';
  createdAt: string;
  executedAt?: string;
}

export interface Negotiation {
  id: string;
  subject: string;
  category: string;
  description: string;
  initiatorId: string;
  initiatorName: string;
  initiatorBusiness: string;
  counterpartyId: string;
  counterpartyName: string;
  counterpartyBusiness: string;
  targetBudget?: number;
  currency: string;
  status: NegotiationStatus;
  currentAmount: number;
  currentOfferId?: string;
  lastOfferBy?: string;
  totalRounds: number;
  createdAt: string;
  updatedAt: string;
  agreementId?: string;
  isFlagged?: boolean;
  flagReason?: string;
}

export interface DecisionSupportMetrics {
  currentBuyerOffer: number;
  currentSellerAsk: number;
  gapAmount: number;
  gapPercentage: number;
  roundsCount: number;
  averageConcessionRate: number;
  convergenceTrajectory: {
    round: number;
    amount: number;
    party: string;
    label: string;
    gap?: number;
  }[];
  negotiationVelocityHours: number;
  recommendedNextStep: string;
}
