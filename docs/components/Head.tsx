import NextHead from 'next/head';
import type { PropsWithChildren } from 'react';

type HeadProps = PropsWithChildren<{ title?: string; description?: string }>;

const BASE_TITLE = 'Expo Documentation';
const BASE_DESCRIPTION = `Expo is an open-source platform for making universal native apps for Android, iOS, and the web with JavaScript and React.`;

const Head = ({ title, description, children }: HeadProps) => (
  <NextHead>
    <title>{title ? `${title} - ${BASE_TITLE}` : BASE_TITLE}</title>
    <meta charSet="utf-8" />
    <meta httpEquiv="X-UA-Compatible" content="IE=edge" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <link rel="icon" type="image/png" href="/static/images/favicon.ico" sizes="32x32" />

    <meta name="description" content={description === '' ? BASE_DESCRIPTION : description} />
    <meta property="og:title" content={title} />
    <meta property="og:type" content="website" />
    <meta property="og:image" content="https://docs.expo.dev/static/images/og.png" />
    <meta property="og:image:url" content="https://docs.expo.dev/static/images/og.png" />
    <meta property="og:image:secure_url" content="https://docs.expo.dev/static/images/og.png" />
    <meta property="og:locale" content="en_US" />
    <meta property="og:site_name" content={BASE_TITLE} />
    <meta property="og:description" content={description === '' ? BASE_DESCRIPTION : description} />

    <meta name="twitter:site" content="@expo" />
    <meta name="twitter:card" content="summary" />
    <meta property="twitter:title" content={title} />
    <meta
      name="twitter:description"
      content={description === '' ? BASE_DESCRIPTION : description}
    />
    <meta property="twitter:image" content="https://docs.expo.dev/static/images/twitter.png" />

    {children}
  </NextHead>
);

export default Head;
