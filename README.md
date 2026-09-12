# PactPoint — Online Business Negotiation & Dealroom Platform

PactPoint is a full-stack commercial bargaining and contract finalization platform built with **React (Vite)**, **TypeScript**, **Tailwind CSS**, and **Firebase (Firestore, Auth, Storage)**.

Designed specifically around a **modern law & corporate fintech** visual identity (confident navy, teal accents, clean paper-trail records) rather than a generic SaaS template.

---

## ⚡ Quick Start (Run Locally)

Open PowerShell or Command Prompt in this folder (`c:\Users\ACER\Desktop\Paki`):

```bash
# 1. Install all dependencies
npm install

# 2. Start the local development server
npm run dev
```

Visit `http://localhost:5173` in your browser.

> [!TIP]
> **Zero Configuration Required Out of the Box:**
> PactPoint comes pre-configured with an **Interactive Dual-Mode Engine**. It works immediately with rich demo data (Sarah Jenkins - Business Owner, Marcus Vance - Negotiator, Elena Rostova - Owner, David Sterling - Admin). You can switch roles in 1-click from the top navigation bar to test all permissions, offer exchanges, and agreements without needing to set up Firebase first.

---

## 🔥 Step-by-Step Firebase Setup Guide

When you are ready to connect your own live Firebase project:

### Step 1: Create a Firebase Project
1. Go to the [Firebase Console](https://console.firebase.google.com/).
2. Click **Add project**, name it (e.g. `pactpoint-deals`), and proceed.

### Step 2: Register a Web App
1. On your project overview page, click the Web icon `</>` to register a web app.
2. Name the app (e.g. `pactpoint-web`) and click **Register app**.
3. Firebase will show your `firebaseConfig` keys.

### Step 3: Configure Environment Variables
1. In `c:\Users\ACER\Desktop\Paki`, create a file named `.env` (or copy `.env.example` to `.env`).
2. Paste your Firebase credentials into `.env`:

```env
VITE_FIREBASE_API_KEY=AIzaSy...
VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project
VITE_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789
VITE_FIREBASE_APP_ID=1:123456789:web:abcdef
```

### Step 4: Enable Authentication Providers
1. In the Firebase Console, go to **Build > Authentication** > **Sign-in method**.
2. Enable **Email/Password**.
3. (Optional) Enable **Google** sign-in if you want 1-click Google accounts.

### Step 5: Enable Cloud Firestore
1. Go to **Build > Firestore Database** and click **Create database**.
2. Select your preferred region (e.g., `nam5 (us-central)`).
3. Go to the **Rules** tab and paste the contents of `firestore.rules` included in this repository. Click **Publish**.

### Step 6: Enable Firebase Storage (for document uploads)
1. Go to **Build > Storage** and click **Get started**.
2. Choose default security rules and your bucket region.

---

## 🏛️ Platform Architecture & Features

### 1. Distinctive Marketing Landing Page
- Real navigation bar with brand mark, live dealroom link, and interactive role switcher.
- Concrete value proposition: "Negotiate commercial deals online. Faster, auditable, defensible."
- Dynamic "How It Works" 4-step interactive flow (Initiate → Exchange Offers → Decision Support → Agreement & E-Signature).
- Asymmetric feature showcases highlighting chronological offer lineage and quantitative spread analysis.
- Detailed stakeholder breakdown for Business Owners, Retained Negotiators, and Platform Administrators.

### 2. Role-Based Access Control (RBAC)
- **Business Owner**: Launches negotiations, issues opening offers, accepts/rejects counteroffers, signs binding agreements.
- **Negotiator**: Represents business entities, manages tactical rounds, submits contingencies and terms.
- **Platform Admin**: Platform-wide oversight, user directory management, role adjustments, risk-flagged room auditing, and macro Recharts volume analytics.

### 3. Realtime Negotiation Dealroom
- **Visual Offer Timeline**: Alternating cards showing financial figures, revisions, delivery schedules, and statuses (`pending`, `countered`, `accepted`, `rejected`).
- **Counteroffer Drawer**: Input revised amounts, payment schedules, and contingency conditions.
- **Room-Scoped Realtime Chat**: Live messaging synchronized between authenticated room parties with automated audit logs on offer submissions.
- **Document Vault**: Upload and download contract PDFs and specification attachments.

### 4. Transparent Decision Support & Gap Analytics
- **Bid-Ask Spread Gap**: Real-time monetary difference and percentage divergence between highest buyer bid and lowest seller ask.
- **Convergence Trajectory Chart**: Interactive Recharts step/line chart plotting offer progression across rounds.
- **Concession Velocity**: Concession pacing and transparent, rule-based recommendations. *(Explicitly documented as transparent mathematical decision-support, noting predictive ML as a future roadmap enhancement).*

### 5. Executable Agreement & Digital E-Signature
- Automatically generated formal Agreement Summary with reference numbers, legal party names, and final financial terms.
- UETA / ESIGN compliant typed signature attestation with timestamp logging.
- `@media print` optimized printable view for instant browser PDF generation.

---

## 📁 Repository Structure

```
c:\Users\ACER\Desktop\Paki/
├── firestore.rules              # Granular Firestore security rules
├── .env.example                 # Firebase environment configuration template
├── package.json                 # Project dependencies & Vite scripts
├── tailwind.config.js           # Executive Navy & Teal color system
├── src/
│   ├── types/index.ts           # Domain models: User, Negotiation, Offer, Agreement
│   ├── lib/
│   │   ├── firebase.ts          # Dual-mode Firebase client & fallback detector
│   │   ├── seedData.ts          # Realistic initial enterprise deals & accounts
│   │   └── utils.ts             # Formats, XSS sanitization, rule-based analytics
│   ├── context/
│   │   ├── AuthContext.tsx      # Auth provider + 1-click demo persona switcher
│   │   └── NegotiationContext.tsx # Live room sync, offers, chat, agreements
│   ├── components/
│   │   ├── common/              # Navbar, Footer, Badge, Modal
│   │   ├── layout/              # DashboardLayout with sidebar & role switcher
│   │   └── decisionSupport/     # Gap analysis, Recharts trajectory, rounds meter
│   └── features/
│       ├── landing/             # Marketing landing page
│       ├── auth/                # Login & Signup with zod schemas
│       ├── dashboard/           # Owner & Negotiator dashboard
│       ├── negotiations/        # Room timeline, counteroffers, chat, documents
│       ├── agreement/           # Formal Agreement Summary & e-signature pad
│       └── admin/               # Platform metrics, Recharts charts, user directory
```

---

## 🛠️ Verification Commands

To check for type errors or test building:
```bash
npm run build
```
