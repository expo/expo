import Head from 'next/head';
import { useRouter } from 'next/router';

import { getCanonicalPath, hasJapaneseTranslation } from '~/common/i18n';

const BASE_URL = 'https://docs.expo.dev';

export function HreflangAlternates() {
  const router = useRouter();

  if (!hasJapaneseTranslation(router.asPath)) {
    return null;
  }

  const canonicalPath = getCanonicalPath(router.asPath);
  const enHref = `${BASE_URL}${canonicalPath}`;
  const jaHref = `${BASE_URL}/ja${canonicalPath === '/' ? '' : canonicalPath}`;

  return (
    <Head>
      <link rel="alternate" hrefLang="en" href={enHref} />
      <link rel="alternate" hrefLang="ja" href={jaHref} />
      <link rel="alternate" hrefLang="x-default" href={enHref} />
    </Head>
  );
}
