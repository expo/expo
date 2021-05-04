import Head from 'next/head';
import Router from 'next/router';
import React, { useEffect } from 'react';

export function LoadAnalytics({ id }: { id: string }) {
  return (
    <Head>
      <script defer src={`https://www.googletagmanager.com/gtag/js?id=${id}`} />
    </Head>
  );
}

export function TrackPageView({ id }: { id: string }) {
  useEffect(() => {
    Router.events.on('routeChangeComplete', (url: string) => {
      window?.gtag?.('config', id, {
        page_path: url,
        transport_type: 'beacon',
      });
    });
  }, []);

  return <noscript />;
}
