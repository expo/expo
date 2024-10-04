import { NextWebVitalsMetric } from 'next/app';
import { useRouter } from 'next/compat/router';
import Script from 'next/script';
import React, { PropsWithChildren, useEffect } from 'react';

/** The global analytics measurement ID */
const MEASUREMENT_ID = 'G-YKNPYCMLWY';

type AnalyticsProps = PropsWithChildren<object>;

/**
 * @see https://nextjs.org/docs/messages/next-script-for-ga
 * @see https://nextjs.org/docs/basic-features/script#lazyonload
 */
export function AnalyticsProvider(props: AnalyticsProps) {
  const router = useRouter();

  useEffect(function didMount() {
    router?.events.on('routeChangeComplete', reportPageView);
    return function didUnmount() {
      router?.events.off('routeChangeComplete', reportPageView);
    };
  }, []);

  return (
    <>
      <Script
        id="gtm-script"
        strategy="lazyOnload"
        src={`https://www.googletagmanager.com/gtag/js?id=${MEASUREMENT_ID}`}
      />
      <Script id="gtm-init" strategy="lazyOnload">{`
        window.dataLayer = window.dataLayer || [];
        function gtag(){dataLayer.push(arguments);}
        gtag('js', new Date());
        gtag('config', '${MEASUREMENT_ID}', { 'transport_type': 'beacon', 'anonymize_ip': true });
      `}</Script>
      {props.children}
    </>
  );
}

export function reportPageView(url: string) {
  window?.gtag?.('config', MEASUREMENT_ID, {
    page_path: url,
    transport_type: 'beacon',
    anonymize_ip: true,
  });
}

export function reportWebVitals({ id, name, label, value }: NextWebVitalsMetric) {
  window?.gtag?.('event', name, {
    event_category: label === 'web-vital' ? 'Web Vitals' : 'Next.js custom metric',
    // Google Analytics metrics must be integers, so the value is rounded.
    // For CLS the value is first multiplied by 1000 for greater precision
    // (note: increase the multiplier for greater precision if needed).
    value: Math.round(name === 'CLS' ? value * 1000 : value),
    // The `id` value will be unique to the current page load. When sending
    // multiple values from the same page (e.g. for CLS), Google Analytics can
    // compute a total by grouping on this ID (note: requires `eventLabel` to
    // be a dimension in your report).
    event_label: id,
    // Use a non-interaction event to avoid affecting bounce rate.
    non_interaction: true,
    anonymize_ip: true,
  });
}

export function reportPageVote({ status }: { status: boolean }) {
  window?.gtag?.('event', status ? 'page_vote_up' : 'page_vote_down', {
    event_category: 'Page vote',
    value: window?.location.pathname,
    // Use a non-interaction event to avoid affecting bounce rate.
    non_interaction: true,
    anonymize_ip: true,
  });
}

export function reportEasTutorialCompleted() {
  window?.gtag?.('event', 'eas_tutorial', {
    event_category: 'EAS Tutorial Completed',
    event_label: 'All chapters in EAS Tutorial completed',
    // Use a non-interaction event to avoid affecting bounce rate.
    non_interaction: true,
    anonymize_ip: true,
  });
}
