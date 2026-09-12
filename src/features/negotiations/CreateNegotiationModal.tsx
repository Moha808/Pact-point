import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Modal } from '../../components/common/Modal';
import { useNegotiation } from '../../context/NegotiationContext';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Briefcase, DollarSign, Building2, Calendar, FileText, ArrowRight } from 'lucide-react';

const createNegSchema = z.object({
  subject: z.string().min(5, 'Dealroom title must be at least 5 characters'),
  category: z.string().min(2, 'Select a commercial category'),
  description: z.string().min(10, 'Provide a clear summary of what is being bargained'),
  counterpartyUserId: z.string().min(1, 'Select a target counterparty organization'),
  initialAmount: z.number().min(1, 'Initial opening offer must be greater than ₦0'),
  currency: z.string().default('NGN'),
  initialTerms: z.string().min(10, 'Initial proposed terms must be specified'),
  paymentSchedule: z.string().optional(),
  deliveryTimeline: z.string().optional(),
  contingencies: z.string().optional(),
});

type CreateNegFormData = z.infer<typeof createNegSchema>;

interface CreateNegotiationModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CreateNegotiationModal: React.FC<CreateNegotiationModalProps> = ({
  isOpen,
  onClose,
}) => {
  const { createNegotiation } = useNegotiation();
  const { registeredUsers, currentUser } = useAuth();
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Real registered users excluding current user and admins
  const counterparties = registeredUsers.filter(
    (u) => u.uid !== currentUser?.uid && u.role !== 'admin'
  );

  // Unified lookup for onSubmit resolution
  const allCounterpartyOptions = [...counterparties];

  const {
    register,
    handleSubmit,
    setValue,
    reset,
    formState: { errors },
  } = useForm<CreateNegFormData>({
    resolver: zodResolver(createNegSchema),
    defaultValues: {
      category: 'Software & Technology Services',
      currency: 'NGN',
      initialAmount: 5000000,
      paymentSchedule: 'Net 30 calendar days upon delivery milestone',
      deliveryTimeline: 'Within 14 business days of bilateral execution',
      contingencies: 'Mutual execution of Standard Confidentiality Agreement.',
    },
  });

  const onSubmit = async (data: CreateNegFormData) => {
    try {
      setIsSubmitting(true);
      const targetUser = allCounterpartyOptions.find((u) => u.uid === data.counterpartyUserId);
      if (!targetUser) return;

      const newId = await createNegotiation({
        subject: data.subject,
        category: data.category,
        description: data.description,
        counterpartyId: targetUser.uid,
        counterpartyName: targetUser.fullName,
        counterpartyBusiness: targetUser.businessName,
        initialAmount: Number(data.initialAmount),
        currency: data.currency,
        initialTerms: data.initialTerms,
        paymentSchedule: data.paymentSchedule,
        deliveryTimeline: data.deliveryTimeline,
        contingencies: data.contingencies,
      });

      reset();
      onClose();
      navigate(`/rooms/${newId}`);
    } catch (err) {
      console.error('Failed to create room:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Initiate New Commercial Dealroom"
      subtitle="Establish baseline terms, opening anchor price, and invite the counterparty"
      maxWidth="max-w-2xl"
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {/* Subject & Category */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="sm:col-span-2">
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
              Negotiation Subject / Deal Title
            </label>
            <input
              type="text"
              placeholder="e.g. Master Logistics Services & Fleet Subcontract"
              {...register('subject')}
              className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 text-sm focus:ring-2 focus:ring-teal-600 focus:outline-none"
            />
            {errors.subject && (
              <p className="text-xs text-rose-600 dark:text-rose-400 mt-1">{errors.subject.message}</p>
            )}
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
              Category
            </label>
            <select
              {...register('category')}
              className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-teal-600 focus:outline-none"
            >
              <option value="Software & Technology Services">Software &amp; Tech</option>
              <option value="Commercial Contracting">Commercial Contract</option>
              <option value="Commercial Real Estate">Real Estate &amp; Sublease</option>
              <option value="Supply Chain & Procurement">Procurement</option>
              <option value="Corporate Settlement">Legal Settlement</option>
            </select>
          </div>
        </div>

        {/* Counterparty Selection */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
            Target Counterparty Organization
          </label>
          <select
            {...register('counterpartyUserId')}
            className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-teal-600 focus:outline-none"
          >
            <option value="">Select counterparty...</option>
            {counterparties.map((u) => (
              <option key={u.uid} value={u.uid}>
                {u.businessName} — {u.fullName} ({u.role.toUpperCase()})
              </option>
            ))}
          </select>
          {errors.counterpartyUserId && (
            <p className="text-xs text-rose-600 dark:text-rose-400 mt-1">{errors.counterpartyUserId.message}</p>
          )}
        </div>

        {/* Description */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
            Executive Summary / Bargaining Scope
          </label>
          <textarea
            rows={2}
            placeholder="Summarize the core objectives, baseline performance metrics, and deliverables expected..."
            {...register('description')}
            className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 text-sm focus:ring-2 focus:ring-teal-600 focus:outline-none"
          />
          {errors.description && (
            <p className="text-xs text-rose-600 dark:text-rose-400 mt-1">{errors.description.message}</p>
          )}
        </div>

        {/* Opening Offer Amount & Currency */}
        {/* Monetary Anchor Box */}
        <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
          <div className="flex items-center gap-1.5 text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider mb-2">
            <span className="font-bold text-teal-700 dark:text-teal-400">₦</span>
            Opening Anchor Offer
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="sm:col-span-2">
              <label className="block text-[11px] font-medium text-slate-500 dark:text-slate-400 mb-1">
                Monetary Amount
              </label>
              <div className="relative">
                <span className="absolute left-3 top-2 text-slate-400 font-bold">₦</span>
                <input
                  type="number"
                  step="1000"
                  {...register('initialAmount', { valueAsNumber: true })}
                  className="w-full pl-8 pr-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm font-semibold focus:ring-2 focus:ring-teal-600 focus:outline-none"
                />
              </div>
              {errors.initialAmount && (
                <p className="text-xs text-rose-600 dark:text-rose-400 mt-1">{errors.initialAmount.message}</p>
              )}
            </div>

            <div>
              <label className="block text-[11px] font-medium text-slate-500 dark:text-slate-400 mb-1">
                Currency
              </label>
              <select
                {...register('currency')}
                className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-teal-600 focus:outline-none"
              >
                <option value="NGN">NGN (₦)</option>
                <option value="USD">USD ($)</option>
                <option value="EUR">EUR (€)</option>
                <option value="GBP">GBP (£)</option>
              </select>
            </div>
          </div>
        </div>

        {/* Initial Proposed Terms */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
            Initial Proposed Terms &amp; Conditions
          </label>
          <textarea
            rows={2}
            placeholder="Specific deliverables, service-level guarantees, warranty periods, or milestones..."
            {...register('initialTerms')}
            className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 text-sm focus:ring-2 focus:ring-teal-600 focus:outline-none"
          />
          {errors.initialTerms && (
            <p className="text-xs text-rose-600 dark:text-rose-400 mt-1">{errors.initialTerms.message}</p>
          )}
        </div>

        {/* Payment Schedule & Timeline */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-1">
              Payment Schedule
            </label>
            <input
              type="text"
              placeholder="e.g. 50% upfront, 50% on milestone acceptance"
              {...register('paymentSchedule')}
              className="w-full px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 text-xs focus:ring-2 focus:ring-teal-600 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-1">
              Delivery Schedule
            </label>
            <input
              type="text"
              placeholder="e.g. 14 calendar days"
              {...register('deliveryTimeline')}
              className="w-full px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 text-xs focus:ring-2 focus:ring-teal-600 focus:outline-none"
            />
          </div>
        </div>

        {/* Modal Actions */}
        <div className="pt-3 border-t border-slate-100 dark:border-slate-700 flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="px-5 py-2 rounded-lg bg-slate-900 dark:bg-teal-700 hover:bg-slate-800 dark:hover:bg-teal-600 text-white text-xs font-semibold shadow flex items-center gap-1.5 transition-colors"
          >
            {isSubmitting ? 'Provisioning Dealroom...' : 'Initialize Dealroom'}
            <ArrowRight className="w-3.5 h-3.5 text-teal-400 dark:text-white" />
          </button>
        </div>
      </form>
    </Modal>
  );
};
