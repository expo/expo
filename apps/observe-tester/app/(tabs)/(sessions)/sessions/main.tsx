import AppMetrics, { type DebugSession } from 'expo-app-metrics';
import { useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';

import { SessionDetail, liveSessionToRecord } from '@/components/SessionDetail';

export default function MainSessionScreen() {
  const [session, setSession] = useState<DebugSession | null>(null);
  const [loaded, setLoaded] = useState(false);

  useFocusEffect(
    useCallback(() => {
      let cancelled = false;
      const mainSession = AppMetrics.getMainSession();
      liveSessionToRecord(mainSession).then((record) => {
        if (cancelled) return;
        setSession(record);
        setLoaded(true);
      });
      return () => {
        cancelled = true;
      };
    }, [])
  );

  return <SessionDetail session={session} loaded={loaded} title="Main session" />;
}
