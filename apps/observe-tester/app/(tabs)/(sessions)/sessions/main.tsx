import AppMetrics, { type Session } from 'expo-app-metrics';
import { useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';

import { SessionDetail, liveSessionToRecord } from '@/components/SessionDetail';

export default function MainSessionScreen() {
  const [session, setSession] = useState<Session | null>(null);
  const [loaded, setLoaded] = useState(false);

  useFocusEffect(
    useCallback(() => {
      let cancelled = false;
      AppMetrics.getMainSession().then((mainSession) => {
        if (cancelled) return;
        setSession(mainSession ? liveSessionToRecord(mainSession) : null);
        setLoaded(true);
      });
      return () => {
        cancelled = true;
      };
    }, [])
  );

  return <SessionDetail session={session} loaded={loaded} title="Main session" />;
}
