import NextHead from 'next/head';
import type { PropsWithChildren } from 'react';

type HeadProps = PropsWithChildren<{ title?: string; description?: string; canonicalUrl?: string }>;

const BASE_OG_URL = 'https://og.expo.dev/?theme=docs';

const BASE_TITLE = 'Expo Documentation';
const BASE_DESCRIPTION = `Expo is an open-source platform for making universal native apps for Android, iOS, and the web with JavaScript and React.`;

const DocumentationHead = ({ title, description, canonicalUrl, children }: HeadProps) => {
  const OGImageURL = `${BASE_OG_URL}&title=${encodeURIComponent(title ?? BASE_TITLE)}&description=${encodeURIComponent(description ?? BASE_DESCRIPTION)}`;

  return (
    <NextHead>
      <title>{title ? `${title} - ${BASE_TITLE}` : BASE_TITLE}</title>
      <meta charSet="utf-8" />
      <meta httpEquiv="X-UA-Compatible" content="IE=edge" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      <link rel="icon" type="image/png" href="/static/images/favicon.ico" sizes="32x32" />
      {canonicalUrl && <link rel="canonical" href={canonicalUrl} />}

      <meta name="description" content={description === '' ? BASE_DESCRIPTION : description} />
      <meta property="og:title" content={title} />
      <meta property="og:type" content="website" />
      <meta property="og:image" content={OGImageURL} />
      <meta property="og:image:url" content={OGImageURL} />
      <meta property="og:image:secure_url" content={OGImageURL} />
      <meta property="og:locale" content="en_US" />
      <meta property="og:site_name" content={BASE_TITLE} />
      <meta
        property="og:description"
        content={description === '' ? BASE_DESCRIPTION : description}
      />

      <meta name="twitter:site" content="@expo" />
      <meta name="twitter:card" content="summary_large_image" />
      <meta property="twitter:title" content={title} />
      <meta
        name="twitter:description"
        content={description === '' ? BASE_DESCRIPTION : description}
      />
      <meta property="twitter:image" content={OGImageURL} />
      <meta name="google-site-verification" content="izrqNurn_EXfYbNIFgVIhEXkkZk9DleELH4UouM8s3k" />

      {children}
    </NextHead>
  );
};

export default DocumentationHead;
