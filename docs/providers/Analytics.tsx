import {
  isAnalyticsConsented,
  enqueueAnalyticsEvent,
  setAnalyticsReplayFn,
  getAnalyticsConsentStatus,
} from '@expo/styleguide-cookie-consent';
import type { QueuedEvent } from '@expo/styleguide-cookie-consent';
import { NextWebVitalsMetric } from 'next/app';
import { useRouter } from 'next/compat/router';
import { useEffect } from 'react';

/** The global analytics measurement ID */
const MEASUREMENT_ID = 'G-YKNPYCMLWY';

/**
 * Hook that subscribes to Next.js router events and reports page views.
 * Call this from the App component in _app.tsx.
 */
export function useAnalyticsPageTracking() {
  const router = useRouter();

  useEffect(function didMount() {
    router?.events.on('routeChangeComplete', reportPageView);
    return function didUnmount() {
      router?.events.off('routeChangeComplete', reportPageView);
    };
  }, []);
}

export function reportPageView(url: string) {
  if (isAnalyticsConsented()) {
    window?.gtag?.('config', MEASUREMENT_ID, {
      page_path: url,
      transport_type: 'beacon',
      anonymize_ip: true,
    });
    return;
  }

  if (getAnalyticsConsentStatus() === 'pending') {
    enqueueAnalyticsEvent({
      type: 'track',
      args: ['pageview', url],
      timestamp: Date.now(),
    });
  }
}

export function reportWebVitals({ id, name, label, value }: NextWebVitalsMetric) {
  const payload = {
    event_category: label === 'web-vital' ? 'Web Vitals' : 'Next.js custom metric',
    value: Math.round(name === 'CLS' ? value * 1000 : value),
    event_label: id,
    non_interaction: true,
    anonymize_ip: true,
  };

  if (isAnalyticsConsented()) {
    window?.gtag?.('event', name, payload);
    return;
  }

  if (getAnalyticsConsentStatus() === 'pending') {
    enqueueAnalyticsEvent({
      type: 'track',
      args: ['webvitals', { name, ...payload }],
      timestamp: Date.now(),
    });
  }
}

export function reportPageVote({ status }: { status: boolean }) {
  const eventName = status ? 'page_vote_up' : 'page_vote_down';
  const payload = {
    event_category: 'Page vote',
    value: typeof window !== 'undefined' ? window.location.pathname : '',
    non_interaction: true,
    anonymize_ip: true,
  };

  if (isAnalyticsConsented()) {
    window?.gtag?.('event', eventName, payload);
    return;
  }

  if (getAnalyticsConsentStatus() === 'pending') {
    enqueueAnalyticsEvent({
      type: 'track',
      args: ['pagevote', { status, eventName, ...payload }],
      timestamp: Date.now(),
    });
  }
}

export function reportEasTutorialCompleted() {
  const payload = {
    event_category: 'EAS Tutorial Completed',
    event_label: 'All chapters in EAS Tutorial completed',
    non_interaction: true,
    anonymize_ip: true,
  };

  if (isAnalyticsConsented()) {
    window?.gtag?.('event', 'eas_tutorial', payload);
    return;
  }

  if (getAnalyticsConsentStatus() === 'pending') {
    enqueueAnalyticsEvent({
      type: 'track',
      args: ['eas_tutorial', payload],
      timestamp: Date.now(),
    });
  }
}

// Register the replay function so queued events are dispatched when consent is granted.
setAnalyticsReplayFn((events: QueuedEvent[]) => {
  for (const event of events) {
    if (event.type !== 'track') {
      continue;
    }

    const [eventType, data] = event.args as [string, unknown];

    switch (eventType) {
      case 'pageview': {
        const url = data as string;
        window?.gtag?.('config', MEASUREMENT_ID, {
          page_path: url,
          transport_type: 'beacon',
          anonymize_ip: true,
        });
        break;
      }
      case 'webvitals': {
        const { name, ...payload } = data as Record<string, unknown>;
        window?.gtag?.('event', name as string, payload);
        break;
      }
      case 'pagevote': {
        const { eventName, ...payload } = data as Record<string, unknown>;
        window?.gtag?.('event', eventName as string, payload);
        break;
      }
      case 'eas_tutorial': {
        const payload = data as Record<string, unknown>;
        window?.gtag?.('event', 'eas_tutorial', payload);
        break;
      }
    }
  }
});
