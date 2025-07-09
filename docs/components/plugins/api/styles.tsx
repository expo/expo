import { mergeClasses } from '@expo/styleguide';

export const ELEMENT_SPACING = mergeClasses('mb-2.5 [table_&]:last:mb-0');
export const VERTICAL_SPACING = mergeClasses('mx-4');

export const STYLES_SECONDARY = mergeClasses('text-xs font-medium text-tertiary');

export const STYLES_OPTIONAL = mergeClasses('flex !text-3xs text-tertiary');

export const STYLES_APIBOX = mergeClasses(
  'mb-5 overflow-hidden rounded-lg border border-palette-gray4 shadow-xs',
  '[&_h2]:mt-0 [&_h3]:mt-0 [&_h4]:mt-0',
  '[&_h3]:mb-1.5',
  '[&_h4]:mb-0',
  '[&_li]:mb-0',
  '[&_thead]:border-palette-gray4',
  '[&_th]:px-4 [&_th]:text-tertiary',
  '[&_td]:border-palette-gray4 [&_td]:py-3',
  '[&_.table-wrapper]:mb-0 [&_.table-wrapper]:border-palette-gray4 [&_.table-wrapper]:shadow-none'
);

export const STYLES_APIBOX_NESTED = mergeClasses('mb-4 shadow-none [&_h4]:mt-0');

export const STYLES_APIBOX_WRAPPER = mergeClasses('mb-3.5', '[&_.table-wrapper]:last:mb-4');
