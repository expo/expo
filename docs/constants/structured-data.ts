type BreadcrumbItem = {
  name: string;
  url?: string;
};

export function buildBreadcrumbListSchema(items: BreadcrumbItem[]) {
  if (items.length < 2) {
    return null;
  }

  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      ...(item.url ? { item: item.url } : {}),
    })),
  };
}

type TechArticleInput = {
  title: string;
  description?: string;
  modificationDate?: string;
  url: string;
};

export function buildTechArticleSchema({
  title,
  description,
  modificationDate,
  url,
}: TechArticleInput) {
  return {
    '@context': 'https://schema.org',
    '@type': 'TechArticle',
    headline: title,
    ...(description ? { description } : {}),
    ...(modificationDate ? { dateModified: modificationDate } : {}),
    publisher: { '@type': 'Organization', name: 'Expo' },
    url,
  };
}

export const websiteSchema = {
  '@context': 'https://schema.org',
  '@type': 'WebSite',
  name: 'Expo Documentation',
  url: 'https://docs.expo.dev',
  publisher: {
    '@type': 'Organization',
    name: 'Expo',
    url: 'https://expo.dev',
    logo: {
      '@type': 'ImageObject',
      url: 'https://docs.expo.dev/static/images/expo-logo.svg',
    },
    sameAs: [
      'https://github.com/expo',
      'https://x.com/expo',
      'https://bsky.app/profile/expo.dev',
      'https://www.linkedin.com/company/expo-dev/',
      'https://www.youtube.com/@expodevelopers',
    ],
  },
};
