import AppMetrics, { type Session } from 'expo-app-metrics';
import { useFocusEffect, useLocalSearchParams } from 'expo-router';
import { useCallback, useState } from 'react';

import { SessionDetail } from '@/components/SessionDetail';

export default function InactiveSessionScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [session, setSession] = useState<Session | null>(null);
  const [loaded, setLoaded] = useState(false);

  useFocusEffect(
    useCallback(() => {
      let cancelled = false;
      AppMetrics.getInactiveSessions().then((sessions) => {
        if (cancelled) return;
        setSession(sessions.find((s) => s.id === id) ?? null);
        setLoaded(true);
      });
      return () => {
        cancelled = true;
      };
    }, [id])
  );

  return <SessionDetail session={session} loaded={loaded} title={id?.slice(0, 8) ?? 'Session'} />;
}
