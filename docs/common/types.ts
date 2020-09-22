import { string } from 'prop-types';

export interface Slugger {
  slug: (string) => string;
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
    _processed?: boolean;
  }[];
};
