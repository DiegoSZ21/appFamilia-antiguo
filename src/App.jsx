import React, { useEffect, useRef, useState } from 'react';
import { storageService } from './services/storageService';
import { notificationService } from './services/notificationService';
import Onboarding from './components/Onboarding';
import Header from './components/Header';
import BottomNav from './components/BottomNav';
import AdminModal from './components/AdminModal';
import ToastBanner from './components/ToastBanner';
import ShoppingModule from './components/ShoppingModule';
import SavingsModule from './components/SavingsModule';
import ChoresModule from './components/ChoresModule';
import EventsModule from './components/EventsModule';

export default function App() {
  const [session, setSession] = useState(() => storageService.getSession());
  const [roomState, setRoomState] = useState(null);
  const [connectionStatus, setConnectionStatus] = useState('offline');
  const [theme, setTheme] = useState(() => storageService.getTheme());
  const [activeTab, setActiveTab] = useState('shopping');
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [toasts, setToasts] = useState([]);
  const [notifPermission, setNotifPermission] = useState(() =>
    notificationService.getPermission()
  );
  const [isSharingLocation, setIsSharingLocation] = useState(false);
  const geoWatchIdRef = useRef(null);

  // Sync theme class on <html>
  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    storageService.saveTheme(theme);
  }, [theme]);

  // Subscribe to in-app toast notifications
  useEffect(() => {
    const unsub = notificationService.subscribeToast((toast) => {
      setToasts((prev) => [toast, ...prev].slice(0, 3));
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== toast.id));
      }, 4200);
    });
    return unsub;
  }, []);

  // Connect to MQTT + BroadcastChannel when session exists
  useEffect(() => {
    const unsubState = storageService.subscribeState(setRoomState);
    const unsubStatus = storageService.subscribeStatus(setConnectionStatus);

    if (session?.roomCode) {
      storageService.connect(session.roomCode, session);
    }

    return () => {
      unsubState();
      unsubStatus();
    };
  }, [session?.roomCode, session?.memberName]);

  // Cleanup geolocation watch on unmount/logout
  useEffect(() => {
    return () => {
      if (geoWatchIdRef.current !== null && navigator.geolocation) {
        navigator.geolocation.clearWatch(geoWatchIdRef.current);
      }
    };
  }, []);

  const handleJoin = (newSession) => {
    storageService.saveSession(newSession);
    setSession(newSession);
  };

  const handleLogout = () => {
    if (geoWatchIdRef.current !== null && navigator.geolocation) {
      navigator.geolocation.clearWatch(geoWatchIdRef.current);
      geoWatchIdRef.current = null;
    }
    setIsSharingLocation(false);
    storageService.clearSession();
    setSession(null);
    setRoomState(null);
  };

  const toggleTheme = () => {
    setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'));
  };

  const handleRequestNotifications = async () => {
    const perm = await notificationService.requestPermission();
    setNotifPermission(perm);
    if (perm === 'granted') {
      notificationService.emitToast({
        title: 'Notificaciones',
        body: '¡Avisos en vivo activados para este dispositivo!',
        emoji: '🔔',
      });
    } else if (perm === 'denied') {
      notificationService.emitToast({
        title: 'Permiso bloqueado',
        body: 'Activa las notificaciones desde el candado del navegador.',
        emoji: '⚠️',
      });
    }
  };

  const handleToggleLocation = () => {
    if (!navigator.geolocation) {
      notificationService.emitToast({
        title: 'Ubicación',
        body: 'Tu navegador no soporta geolocalización.',
        emoji: '⚠️',
      });
      return;
    }

    if (isSharingLocation) {
      if (geoWatchIdRef.current !== null) {
        navigator.geolocation.clearWatch(geoWatchIdRef.current);
        geoWatchIdRef.current = null;
      }
      setIsSharingLocation(false);
      storageService.updateMemberLocation(session.memberName, null);
      notificationService.emitToast({
        title: 'Ubicación',
        body: 'Dejaste de compartir tu ubicación en vivo.',
        emoji: '📍',
      });
      return;
    }

    setIsSharingLocation(true);
    geoWatchIdRef.current = navigator.geolocation.watchPosition(
      (pos) => {
        storageService.updateMemberLocation(session.memberName, {
          lat: Number(pos.coords.latitude.toFixed(5)),
          lng: Number(pos.coords.longitude.toFixed(5)),
          updatedAt: Date.now(),
        });
      },
      () => {
        setIsSharingLocation(false);
        notificationService.emitToast({
          title: 'Ubicación',
          body: 'No se pudo obtener el permiso de ubicación.',
          emoji: '⚠️',
        });
      },
      { enableHighAccuracy: true, maximumAge: 15000, timeout: 10000 }
    );
  };

  if (!session) {
    return <Onboarding onJoin={handleJoin} />;
  }

  const pendingShoppingCount = roomState?.shopping?.pending?.length || 0;
  const activeChoresCount = (roomState?.chores || []).filter(
    (c) => c.status === 'urgent' || c.status === 'assigned'
  ).length;
  const eventsCount = roomState?.events?.length || 0;

  return (
    <div className="min-h-screen bg-warm-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 pb-24 lg:pb-10 lg:pl-64">
      <ToastBanner
        toasts={toasts}
        onDismiss={(id) => setToasts((prev) => prev.filter((t) => t.id !== id))}
      />

      <Header
        session={session}
        roomState={roomState}
        connectionStatus={connectionStatus}
        theme={theme}
        notifPermission={notifPermission}
        isSharingLocation={isSharingLocation}
        onRequestNotifications={handleRequestNotifications}
        onToggleLocation={handleToggleLocation}
        onToggleTheme={toggleTheme}
        onRefresh={() => storageService.refreshConnection()}
        onOpenSettings={() => setSettingsOpen(true)}
        onLogout={handleLogout}
        onStatusChange={(st) => storageService.updateMemberStatus(session.memberName, st)}
        onAddCustomStatus={(label, emoji) =>
          storageService.addCustomStatus(label, emoji, session.memberName)
        }
        onRemoveCustomStatus={(id) =>
          storageService.removeCustomStatus(id, session.memberName)
        }
      />

      <main className="max-w-5xl mx-auto px-4 sm:px-6 pt-5">
        {activeTab === 'shopping' && (
          <ShoppingModule
            roomState={roomState}
            session={session}
            onAddItem={(item) => storageService.addShoppingItem(item, session.memberName)}
            onMarkBought={(id, amt) =>
              storageService.markItemBought(id, amt, session.memberName)
            }
            onRemovePending={(id) =>
              storageService.removeShoppingPending(id, session.memberName)
            }
            onRemoveBought={(id) =>
              storageService.removeShoppingBought(id, session.memberName)
            }
          />
        )}

        {activeTab === 'savings' && (
          <SavingsModule
            roomState={roomState}
            session={session}
            onAddContribution={(goalId, amt) =>
              storageService.addSavingsContribution(goalId, amt, session.memberName)
            }
            onRemoveContribution={(goalId, id) =>
              storageService.removeSavingsContribution(goalId, id, session.memberName)
            }
            onAddGoal={(goal) => storageService.addSavingsGoal(goal, session.memberName)}
            onUpdateGoal={(goalId, goal) =>
              storageService.updateSavingsGoal(goalId, goal, session.memberName)
            }
            onDeleteGoal={(goalId) =>
              storageService.deleteSavingsGoal(goalId, session.memberName)
            }
          />
        )}

        {activeTab === 'chores' && (
          <ChoresModule
            roomState={roomState}
            onSetChoreState={(id, status) =>
              storageService.setChoreState(id, status, session.memberName)
            }
            onAddCustomChore={(label, emoji) =>
              storageService.addCustomChore(label, emoji, session.memberName)
            }
            onEditChore={(id, data) =>
              storageService.editChore(id, data, session.memberName)
            }
            onDeleteChore={(id) =>
              storageService.deleteChore(id, session.memberName)
            }
          />
        )}

        {activeTab === 'events' && (
          <EventsModule
            roomState={roomState}
            session={session}
            onAddEvent={(evt) => storageService.addEvent(evt, session.memberName)}
            onSetRsvp={(id, rsvpId) =>
              storageService.setEventRsvp(id, session.memberName, rsvpId)
            }
            onRemoveEvent={(id) => storageService.removeEvent(id, session.memberName)}
          />
        )}
      </main>

      <BottomNav
        activeTab={activeTab}
        onChangeTab={setActiveTab}
        badges={{
          shopping: pendingShoppingCount,
          chores: activeChoresCount,
          events: eventsCount,
        }}
      />

      <AdminModal
        isOpen={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        roomState={roomState}
        session={session}
        theme={theme}
        notifPermission={notifPermission}
        isSharingLocation={isSharingLocation}
        onToggleTheme={toggleTheme}
        onRequestNotifications={handleRequestNotifications}
        onTestNotification={() =>
          notificationService.sendBrowserNotification('Hogar Conectado', {
            body: '¡Prueba de notificación exitosa!',
            emoji: '🔔',
          })
        }
        onToggleLocation={handleToggleLocation}
        onUpdateBudget={(b) => storageService.updateBudget(b, session.memberName)}
        onUpdateCurrency={(c) => storageService.updateCurrency(c, session.memberName)}
        onResetWeek={() => storageService.resetWeeklyExpenses(session.memberName)}
        onRemoveMember={(name) => storageService.removeMember(name, session.memberName)}
      />
    </div>
  );
}
