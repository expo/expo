import NextHead from 'next/head';
import type { PropsWithChildren } from 'react';

import { BASE_DESCRIPTIONS, OG_LOCALES, SITE_NAMES, type SupportedLocale } from '~/common/i18n';

type HeadProps = PropsWithChildren<{
  title?: string;
  description?: string;
  canonicalUrl?: string;
  markdownPath?: string;
  locale?: SupportedLocale;
}>;

const BASE_OG_URL = 'https://og.expo.dev/?theme=docs';

const DocumentationHead = ({
  title,
  description,
  canonicalUrl,
  markdownPath,
  locale = 'en',
  children,
}: HeadProps) => {
  const siteName = SITE_NAMES[locale];
  const baseDescription = BASE_DESCRIPTIONS[locale];
  const resolvedDescription = description === '' ? baseDescription : description;
  const ogImageContent = {
    title: title ?? siteName,
    description: description ?? baseDescription,
  };
  const OGImageURL = `${BASE_OG_URL}&title=${encodeURIComponent(ogImageContent.title)}&description=${encodeURIComponent(ogImageContent.description)}`;

  return (
    <NextHead>
      <title>{title ? `${title} - ${siteName}` : siteName}</title>
      <meta charSet="utf-8" />
      <meta httpEquiv="X-UA-Compatible" content="IE=edge" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      <link rel="icon" type="image/png" href="/static/images/favicon.ico" sizes="32x32" />
      {canonicalUrl && <link rel="canonical" href={canonicalUrl} />}
      {markdownPath && <link rel="alternate" type="text/markdown" href={markdownPath} />}

      <meta name="description" content={resolvedDescription} />
      <meta property="og:title" content={title} />
      <meta property="og:type" content="website" />
      <meta property="og:image" content={OGImageURL} />
      <meta property="og:image:url" content={OGImageURL} />
      <meta property="og:image:secure_url" content={OGImageURL} />
      <meta property="og:locale" content={OG_LOCALES[locale]} />
      <meta property="og:site_name" content={siteName} />
      <meta property="og:description" content={resolvedDescription} />

      <meta name="twitter:site" content="@expo" />
      <meta name="twitter:card" content="summary_large_image" />
      <meta property="twitter:title" content={title} />
      <meta name="twitter:description" content={resolvedDescription} />
      <meta property="twitter:image" content={OGImageURL} />
      <meta name="google-site-verification" content="izrqNurn_EXfYbNIFgVIhEXkkZk9DleELH4UouM8s3k" />

      {children}
    </NextHead>
  );
};

export default DocumentationHead;
