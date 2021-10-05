import { collapsedSections, hiddenSections } from '~/constants/navigation';
import { PageMetadata } from '~/types/common';

/**
 * Check if the initial state of the section should be collapsed.
 */
export function isSectionCollapsed(name: string): boolean {
  return collapsedSections.includes(name);
}

/**
 * Determine if a category should be hidden or rendered.
 */
export function isCategoryHidden(name: string): boolean {
  return hiddenSections.includes(name);
}

export type Root = {
  type: 'root';
  children: (Category | API)[];
};

export type Category = {
  type: 'category';
  children: (Group | Section)[];
  hidden?: boolean;
};

export type Group = {
  type: 'group';
  children: (Section | Page)[];
  title: string;
  open?: boolean;
};

export type Section = {
  type: 'section';
  children: Page[];
  title: string;
};

export type Page = {
  type: 'page';
  file: string;
  url: string;
  meta: PageMetadata;
};

export type API = {
  type: 'api';
  children: APIVersion[];
};

export type APIVersion = {
  type: 'api-version';
  version: string;
  children: Category['children'];
};
