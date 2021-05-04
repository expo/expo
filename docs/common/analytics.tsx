import Head from 'next/head';
import Router from 'next/router';
import React, { useEffect } from 'react';

export interface GAWindow extends Window {
  gtag(cmd: string, event: string, props?: Record<string, any>): void;
}

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
      const gaWindow = (window as unknown) as GAWindow;
      gaWindow?.gtag?.('config', id, {
        page_path: url,
        transport_type: 'beacon',
      });
    });
  }, []);

  return <noscript />;
}
