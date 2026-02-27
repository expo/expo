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
