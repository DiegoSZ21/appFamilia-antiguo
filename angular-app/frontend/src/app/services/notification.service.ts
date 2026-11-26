import { Injectable, computed, signal } from '@angular/core';

export interface ToastItem {
  id: string;
  title: string;
  body: string;
  emoji: string;
  module?: string;
}

export interface AppNotification {
  id: string;
  title: string;
  body: string;
  emoji: string;
  module?: string;
  timestamp: number;
  read: boolean;
}

const NOTIFICATIONS_STORAGE_KEY = 'hogar_app_notifications_v1';

@Injectable({ providedIn: 'root' })
export class NotificationService {
  toasts = signal<ToastItem[]>([]);
  notifications = signal<AppNotification[]>(this.loadStoredNotifications());
  permission = signal<string>(this.getPermission());
  private lastSeenActivityId: string | null = null;

  unreadCount = computed(() => this.notifications().filter((n) => !n.read).length);

  private loadStoredNotifications(): AppNotification[] {
    try {
      const raw = localStorage.getItem(NOTIFICATIONS_STORAGE_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  }

  private saveStoredNotifications(items: AppNotification[]): void {
    try {
      localStorage.setItem(NOTIFICATIONS_STORAGE_KEY, JSON.stringify(items.slice(0, 40)));
    } catch {
      // Ignore
    }
  }

  isSupported(): boolean {
    return typeof window !== 'undefined' && 'Notification' in window;
  }

  getPermission(): string {
    if (!this.isSupported()) return 'unsupported';
    return Notification.permission;
  }

  async requestPermission(): Promise<string> {
    if (!this.isSupported()) return 'unsupported';
    try {
      const result = await Notification.requestPermission();
      this.permission.set(result);
      if (result === 'granted') {
        this.sendBrowserNotification('Hogar Conectado', {
          body: '¡Notificaciones activadas! Te avisaremos cuando tu familia actualice algo.',
          emoji: '🏡',
        });
      }
      return result;
    } catch {
      this.permission.set('denied');
      return 'denied';
    }
  }

  emitToast(toastData: { title: string; body: string; emoji?: string; module?: string }): void {
    const id = `toast_${Date.now()}_${Math.random().toString(16).slice(2, 6)}`;
    const item: ToastItem = {
      id,
      title: toastData.title,
      body: toastData.body,
      emoji: toastData.emoji || '🔔',
      module: toastData.module,
    };
    this.toasts.update((prev) => [item, ...prev].slice(0, 3));
    setTimeout(() => this.dismissToast(id), 4200);

    // Also persist in the notifications drawer
    this.addNotification({
      id,
      title: toastData.title,
      body: toastData.body,
      emoji: toastData.emoji || '🔔',
      module: toastData.module,
      timestamp: Date.now(),
      read: false,
    });
  }

  dismissToast(id: string): void {
    this.toasts.update((prev) => prev.filter((t) => t.id !== id));
  }

  addNotification(notif: AppNotification): void {
    this.notifications.update((prev) => {
      const filtered = prev.filter((n) => n.id !== notif.id);
      const updated = [notif, ...filtered].slice(0, 35);
      this.saveStoredNotifications(updated);
      return updated;
    });
  }

  markAllAsRead(): void {
    this.notifications.update((prev) => {
      const updated = prev.map((n) => ({ ...n, read: true }));
      this.saveStoredNotifications(updated);
      return updated;
    });
  }

  clearAll(): void {
    this.notifications.set([]);
    this.saveStoredNotifications([]);
  }

  sendBrowserNotification(title: string, opts: { body?: string; emoji?: string } = {}): void {
    if (!this.isSupported() || Notification.permission !== 'granted') return;
    const emoji = opts.emoji || '🏡';
    try {
      new Notification(`${emoji} ${title}`, {
        body: opts.body,
        icon: '/icon.svg',
      });
    } catch {
      // Ignore mobile notification constructor errors
    }
  }

  setInitialActivityId(id: string | null): void {
    this.lastSeenActivityId = id;
  }

  notifyFromActivity(activity: any, currentMemberName?: string): void {
    if (!activity?.id || this.lastSeenActivityId === activity.id) return;
    this.lastSeenActivityId = activity.id;
    const isSelf = activity.actor === currentMemberName;

    this.emitToast({
      title: activity.title || 'Hogar Conectado',
      body: activity.message,
      emoji: activity.emoji || '🔔',
      module: activity.module,
    });

    if (!isSelf) {
      this.sendBrowserNotification(activity.title || 'Hogar Conectado', {
        body: activity.message,
        emoji: activity.emoji || '🔔',
      });
    }
  }
}
