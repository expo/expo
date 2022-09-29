import { ExpoConfig } from 'expo/config';

/*
 * Converts the slug from app configuration to a string that's a valid URI scheme.
 * From RFC3986 Section 3.1.
 * scheme      = ALPHA *( ALPHA / DIGIT / "+" / "-" / "." )
 */
export default function getDefaultScheme(config: Pick<ExpoConfig, 'slug'>): string {
  if (typeof config !== 'object') {
    throw new TypeError('getDefaultScheme: config is not object');
  }
  if (!config.slug || typeof config.slug !== 'string') {
    throw new TypeError('getDefaultScheme: config missing required property "slug"');
  }

  // Remove unallowed characters. Also remove `-` to keep this shorter.
  let scheme = config.slug.replace(/[^A-Za-z0-9+\-.]/g, '');
  // Edge case: if the slug didn't include any allowed characters we may end up with an empty string.
  if (scheme.length === 0) {
    throw new Error(
      'Could not autogenerate a scheme. Please make sure the "slug" property in app config consists of URL friendly characters.'
    );
  }

  // Lowercasing might not be strictly necessary, but let's do it for stylistic purposes.
  scheme = scheme.toLowerCase();

  // Add a prefix to avoid leading digits and to distinguish from user-defined schemes.
  return `exp+${scheme}`;
}
