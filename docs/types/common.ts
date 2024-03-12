export type PageMetadata = {
  title?: string;
  description?: string;
  sourceCodeUrl?: string;
  packageName?: string;
  maxHeadingDepth?: number;
  iconUrl?: string;
  /* If the page should not show up in the Algolia Docsearch results */
  hideFromSearch?: boolean;
  hideTOC?: boolean;
  platforms?: string[];
};

/**
 * A single header from the `remark-export-headings` plugin.
 */
export type RemarkHeading = {
  id?: string;
  depth: number;
  title: string;
  type: string;
};

/**
 * Utility type. Extracts `T` type from `T[]` array.
 */
export type ElementType<T extends any[]> = T extends (infer U)[] ? U : never;

export type Url = {
  pathname: string;
};

export type NavigationType = 'section' | 'group' | 'page';

export type NavigationRoute = {
  type: NavigationType;
  name: string;
  href: string;
  as?: string;
  hidden?: boolean;
  expanded?: boolean;
  sidebarTitle?: string;
  weight?: number;
  children?: NavigationRoute[];
};

export type NavigationRouteWithSection = NavigationRoute & { section?: string };

/**
 * Available platforms supported by our APIs.
 * Temporarily it also accepts other strings for compatibility reasons.
 */
export type PlatformName =
  | 'ios'
  | 'ios-nosim'
  | 'android'
  | 'android-noemu'
  | 'web'
  | 'expo'
  | 'macos'
  | 'tvos'
  | string;
