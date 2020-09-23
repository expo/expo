export interface Slugger {
  slug: (text: string) => string;
}

export type PageMetadata = {
  title: string;
  sourceCodeUrl?: string;
  maxHeadingDepth?: number;
  hideTOC?: boolean;
  headings?: {
    title?: string;
    level?: number;
    type?: string;
    _processed?: boolean; // internal HeadingManager property
  }[];
};

/**
 * Utility type. Extracts `T` type from `T[]` array.
 */
export type Single<T> = T extends (infer U)[] ? U : never;

export type Url = {
  pathname: string;
};

export type NavigationRoute = {
  href?: string;
  name?: string;
  as?: string;
  weight?: number;
  sidebarTitle?: string;
  children?: NavigationRoute[];
  posts?: NavigationRoute[];
};
