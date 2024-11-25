import { mergeClasses } from '@expo/styleguide';

export const ELEMENT_SPACING = mergeClasses('mb-3.5');

export const STYLES_SECONDARY = mergeClasses('text-[14px] font-medium text-secondary');

export const STYLES_OPTIONAL = mergeClasses('pt-5 !text-[13px] text-secondary');

export const STYLES_APIBOX = mergeClasses(
  'mb-6 rounded-lg border border-secondary p-5 shadow-xs',
  '[&_h2]:mt-0 [&_h3]:mt-0 [&_h4]:mt-0',
  '[&_h3]:mb-2.5',
  '[&_li]:mb-0',
  '[&_th]:px-4 [&_th]:py-2.5 [&_th]:text-tertiary',
  '[&_.table-wrapper]:mb-0 [&_.table-wrapper]:shadow-none',
  '[&_th]:px-4 [&_th]:py-2.5 [&_th]:text-tertiary',
  'max-lg-gutters:px-4'
);

export const STYLES_APIBOX_NESTED = mergeClasses('mb-5 px-5 pb-0 pt-4 shadow-none [&_h4]:mt-0');

export const STYLES_APIBOX_WRAPPER = mergeClasses(
  'mb-3.5 px-5 pt-4',
  '[&_.table-wrapper]:last:mb-4'
);
