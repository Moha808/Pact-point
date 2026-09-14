import React, { useState, useEffect, useRef } from 'react';
import { Bell, Check } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { db } from '../../lib/firebase';
import { collection, query, onSnapshot, orderBy, doc, updateDoc, writeBatch, limit } from 'firebase/firestore';
import { Link } from 'react-router-dom';
import { formatRelativeTime } from '../../lib/utils';

export interface NotificationRecord {
  id: string;
  negotiationId: string;
  subject: string;
  initiatorName: string;
  initiatorBusiness: string;
  amount: number;
  currency: string;
  createdAt: string;
  read: boolean;
}

export const NotificationBell: React.FC = () => {
  const { currentUser } = useAuth();
  const [notifications, setNotifications] = useState<NotificationRecord[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!currentUser || !db) return;

    const q = query(
      collection(db, 'notifications', currentUser.uid, 'rooms'),
      orderBy('createdAt', 'desc'),
      limit(10)
    );

    const unsub = onSnapshot(q, (snap) => {
      const list: NotificationRecord[] = [];
      snap.forEach((d) => list.push({ id: d.id, ...d.data() } as NotificationRecord));
      setNotifications(list);
    });

    return () => unsub();
  }, [currentUser]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const handleMarkAsRead = async (id: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!currentUser || !db) return;
    await updateDoc(doc(db, 'notifications', currentUser.uid, 'rooms', id), { read: true });
  };

  const handleMarkAllAsRead = async () => {
    if (!currentUser || !db || unreadCount === 0) return;
    const batch = writeBatch(db);
    notifications.forEach((n) => {
      if (!n.read) {
        batch.update(doc(db, 'notifications', currentUser.uid, 'rooms', n.id), { read: true });
      }
    });
    await batch.commit();
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors focus:outline-none"
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="absolute top-1.5 right-1.5 flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-rose-500 border border-white dark:border-slate-900"></span>
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 bg-white dark:bg-slate-900 rounded-xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden z-50">
          <div className="p-3 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-950/50">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">Notifications</h3>
            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllAsRead}
                className="text-[10px] font-semibold text-teal-600 dark:text-teal-400 hover:underline"
              >
                Mark all as read
              </button>
            )}
          </div>
          <div className="max-h-80 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="p-6 text-center text-xs text-slate-500 dark:text-slate-400">
                You have no new notifications.
              </div>
            ) : (
              <div className="divide-y divide-slate-100 dark:divide-slate-800">
                {notifications.map((n) => (
                  <Link
                    key={n.id}
                    to={`/rooms/${n.negotiationId}`}
                    onClick={() => {
                      if (!n.read) updateDoc(doc(db, 'notifications', currentUser!.uid, 'rooms', n.id), { read: true });
                      setIsOpen(false);
                    }}
                    className={`block p-3 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors relative ${!n.read ? 'bg-teal-50/30 dark:bg-teal-900/10' : ''}`}
                  >
                    {!n.read && (
                      <span className="absolute left-2 top-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full bg-teal-500" />
                    )}
                    <div className={`pl-3 ${!n.read ? 'opacity-100' : 'opacity-70'}`}>
                      <p className="text-xs text-slate-900 dark:text-white font-medium leading-snug">
                        New dealroom <strong className="font-bold">"{n.subject}"</strong> initiated by {n.initiatorName} ({n.initiatorBusiness}).
                      </p>
                      <div className="flex items-center justify-between mt-1">
                        <span className="text-[10px] text-slate-500 dark:text-slate-400">
                          {formatRelativeTime(n.createdAt)}
                        </span>
                        {!n.read && (
                          <button
                            onClick={(e) => handleMarkAsRead(n.id, e)}
                            className="text-[10px] text-teal-600 hover:text-teal-700 dark:text-teal-400 p-1"
                            title="Mark as read"
                          >
                            <Check className="w-3 h-3" />
                          </button>
                        )}
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
