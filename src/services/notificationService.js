// Handles in-app toast listeners and browser Web Notifications API

class NotificationService {
  constructor() {
    this.toastListeners = new Set();
    this.lastSeenActivityId = null;
  }

  subscribeToast(listener) {
    this.toastListeners.add(listener);
    return () => this.toastListeners.delete(listener);
  }

  emitToast({ title, body, module = 'info', emoji = '🔔' }) {
    const toast = {
      id: `toast_${Date.now()}_${Math.random().toString(16).slice(2, 6)}`,
      title,
      body,
      module,
      emoji,
      createdAt: Date.now(),
    };
    this.toastListeners.forEach((fn) => fn(toast));
  }

  isSupported() {
    return typeof window !== 'undefined' && 'Notification' in window;
  }

  getPermission() {
    if (!this.isSupported()) return 'unsupported';
    return Notification.permission; // 'default' | 'granted' | 'denied'
  }

  async requestPermission() {
    if (!this.isSupported()) return 'unsupported';
    try {
      const result = await Notification.requestPermission();
      if (result === 'granted') {
        this.sendBrowserNotification('Hogar Conectado', {
          body: '¡Notificaciones activadas! Te avisaremos cuando tu familia actualice algo.',
          emoji: '🏡',
        });
      }
      return result;
    } catch {
      return 'denied';
    }
  }

  sendBrowserNotification(title, { body, emoji = '🏡' } = {}) {
    if (!this.isSupported() || Notification.permission !== 'granted') return;
    try {
      new Notification(`${emoji} ${title}`, {
        body,
        icon: '/icon.svg',
        badge: '/icon.svg',
        tag: `hogar-${Date.now()}`,
      });
    } catch {
      // Some mobile browsers require SW registration for new Notification
      if (navigator.serviceWorker?.ready) {
        navigator.serviceWorker.ready
          .then((reg) => {
            reg.showNotification(`${emoji} ${title}`, {
              body,
              icon: '/icon.svg',
            });
          })
          .catch(() => {});
      }
    }
  }

  notifyFromActivity(activity, currentMemberName) {
    if (!activity || !activity.id) return;
    if (this.lastSeenActivityId === activity.id) return;
    this.lastSeenActivityId = activity.id;

    // Avoid noisy browser popup for the user's own immediate click,
    // but still show in-app toast for everyone or browser notification for others
    const isSelf = activity.actor === currentMemberName;

    this.emitToast({
      title: activity.title || 'Hogar Conectado',
      body: activity.message,
      module: activity.module,
      emoji: activity.emoji || '🔔',
    });

    if (!isSelf) {
      this.sendBrowserNotification(activity.title || 'Hogar Conectado', {
        body: activity.message,
        emoji: activity.emoji || '🔔',
      });
    }
  }
}

export const notificationService = new NotificationService();
