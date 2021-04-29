import Head from 'next/head';
import React from 'react';

// Initialize the command queue in case analytics.js hasn't loaded yet
const getInitGoogleAnalyticsScript = (id: string) => {
  return `
window.ga=window.ga||function(){(ga.q=ga.q||[]).push(arguments)};ga.l=+new Date;
ga('create', '${id}', {cookieDomain: 'auto', siteSpeedSampleRate: 100});
ga('set', 'transport', 'beacon');
ga('send', 'pageview');
`.replace(/\n/g, '');
};

export function getInitGoogleScriptTag({ id }: { id: string }) {
  const initScript = { __html: getInitGoogleAnalyticsScript(id) };
  return <script dangerouslySetInnerHTML={initScript} />;
}

export function getGoogleScriptTag() {
  return <script defer src="https://www.google-analytics.com/analytics.js" />;
}

export function LoadAnalytics() {
  return <Head>{getGoogleScriptTag()}</Head>;
}
