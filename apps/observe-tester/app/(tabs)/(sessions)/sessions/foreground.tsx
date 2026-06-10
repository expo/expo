import AppMetrics, { type Session } from 'expo-app-metrics';
import { useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';

import { SessionDetail, liveSessionToRecord } from '@/components/SessionDetail';

export default function ForegroundSessionScreen() {
  const [session, setSession] = useState<Session | null>(null);
  const [loaded, setLoaded] = useState(false);

  useFocusEffect(
    useCallback(() => {
      let cancelled = false;
      (async () => {
        // The foreground session is a live shared object, or `null` when none is
        // active (e.g. backgrounded, or platforms without foreground tracking).
        const foreground = await AppMetrics.getForegroundSession();
        if (cancelled) return;
        if (!foreground) {
          setSession(null);
          setLoaded(true);
          return;
        }
        const record = await liveSessionToRecord(foreground);
        if (cancelled) return;
        setSession(record);
        setLoaded(true);
      })();
      return () => {
        cancelled = true;
      };
    }, [])
  );

  return <SessionDetail session={session} loaded={loaded} title="Foreground session" />;
}
