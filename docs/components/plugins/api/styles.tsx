import { mergeClasses } from '@expo/styleguide';

export const ELEMENT_SPACING = mergeClasses('mb-3.5');

export const STYLES_SECONDARY = mergeClasses('text-secondary font-medium text-[14px]');

export const STYLES_OPTIONAL = mergeClasses('text-secondary pt-5 !text-[13px]');

export const STYLES_APIBOX = mergeClasses(
  'rounded-lg border border-secondary p-5 shadow-xs mb-6',
  '[&_h2]:mt-0 [&_h3]:mt-0 [&_h4]:mt-0',
  '[&_h3]:mb-2.5',
  '[&_li]:mb-0',
  '[&_th]:text-tertiary [&_th]:py-2.5 [&_th]:px-4',
  '[&_.table-wrapper]:shadow-none [&_.table-wrapper]:mb-0',
  '[&_th]:text-tertiary [&_th]:py-2.5 [&_th]:px-4',
  'max-lg-gutters:px-4'
);

export const STYLES_APIBOX_NESTED = mergeClasses('shadow-none mb-5 pt-4 px-5 pb-0 [&_h4]:mt-0');

export const STYLES_APIBOX_WRAPPER = mergeClasses(
  'mb-3.5 pt-4 px-5',
  '[&_.table-wrapper]:last:mb-4'
);
