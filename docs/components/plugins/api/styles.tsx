import { mergeClasses } from '@expo/styleguide';

export const ELEMENT_SPACING = mergeClasses('mb-3');

export const STYLES_SECONDARY = mergeClasses('text-xs font-medium text-tertiary');

export const STYLES_OPTIONAL = mergeClasses('flex !text-3xs text-tertiary');

export const STYLES_APIBOX = mergeClasses(
  'mb-5 rounded-lg border border-secondary px-5 py-4 shadow-xs',
  '[&_h2]:mt-0 [&_h3]:mt-0 [&_h4]:mt-0',
  '[&_h3]:mb-1.5',
  '[&_li]:mb-0',
  '[&_th]:px-4 [&_th]:text-tertiary',
  '[&_td]:py-3',
  '[&_.table-wrapper]:mb-0 [&_.table-wrapper]:shadow-none',
  'max-lg-gutters:px-4'
);

export const STYLES_APIBOX_NESTED = mergeClasses('mb-4 px-5 pb-0 pt-4 shadow-none [&_h4]:mt-0');

export const STYLES_APIBOX_WRAPPER = mergeClasses(
  'mb-3.5 px-5 pt-4',
  '[&_.table-wrapper]:last:mb-4'
);
