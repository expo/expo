import Head from 'next/head';
import { useRouter } from 'next/router';
import React, { useEffect } from 'react';

export function LoadAnalytics({ id }: { id: string }) {
  return (
    <Head>
      <script defer src={`https://www.googletagmanager.com/gtag/js?id=${id}`} />
    </Head>
  );
}

export function TrackPageView({ id }: { id: string }) {
  const router = useRouter();

  useEffect(() => {
    const handlePageViewTracking = (url: string) => {
      window?.gtag?.('config', id, {
        page_path: url,
        transport_type: 'beacon',
        anonymize_ip: true,
      });
    };

    router.events.on('routeChangeComplete', handlePageViewTracking);
    return () => {
      router.events.off('routeChangeComplete', handlePageViewTracking);
    };
  }, [router.events]);

  return <noscript />;
}
