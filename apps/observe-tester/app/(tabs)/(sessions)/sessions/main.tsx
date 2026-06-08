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
      // The main session is a live shared object; resolve its lazy data into a record.
      liveSessionToRecord(AppMetrics.getMainSession()).then((record) => {
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
