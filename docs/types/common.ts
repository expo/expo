export type PageMetadata = {
  title?: string;
  sourceCodeUrl?: string;
  maxHeadingDepth?: number;
  /* If the page should not show up in the Algolia Docsearch results */
  hideFromSearch?: boolean;
  hideTOC?: boolean;
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

export type NavigationRoute = {
  as?: string;
  hidden: boolean;
  href: string;
  name: string;
  sidebarTitle?: string;
  weight?: number;
  children?: NavigationRoute[];
  posts?: NavigationRoute[];
};
