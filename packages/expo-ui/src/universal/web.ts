import type { ComponentProps, ElementType } from 'react';
import {
  unstable_createElement,
  type ImageStyle,
  type StyleProp,
  type TextStyle,
  type ViewStyle,
} from 'react-native';

type Simplify<T> = { [K in keyof T]: T[K] };
type Merge<A, B> = Simplify<Omit<A, keyof B> & B>;
type Style = StyleProp<ImageStyle | TextStyle | ViewStyle>;

export const createWebComponent =
  <T extends ElementType>(type: T) =>
  (props: Merge<ComponentProps<T>, { focusable?: boolean; style?: Style }>) =>
    unstable_createElement(type, props);

export const css = (strings: TemplateStringsArray, ...values: unknown[]): string =>
  strings
    .reduce((acc, s, i) => acc + s + (i < values.length ? String(values[i]) : ''), '')
    .replace(/\s+/g, ' ')
    .trim();

const lightVariables = css`
  --eui-default-bg: #ffffff;

  --eui-gray-50: #f9fafb;
  --eui-gray-100: #f0f1f2;
  --eui-gray-150: #eaecf0;
  --eui-gray-200: #e1e4e8;
  --eui-gray-300: #d7dbdf;
  --eui-gray-400: #c9d1d9;
  --eui-gray-500: #687076;
  --eui-gray-600: #596068;
  --eui-gray-700: #37414a;
  --eui-gray-800: #25292e;
  --eui-gray-900: #11181c;

  --eui-shadow-button: 0 1px 2px 0 rgba(0, 0, 0, 0.08);
`;

const darkVariables = css`
  --eui-default-bg: #0b0f14;

  --eui-gray-50: #111418;
  --eui-gray-100: #1d2128;
  --eui-gray-150: #252932;
  --eui-gray-200: #1f242c;
  --eui-gray-300: #30363d;
  --eui-gray-400: #484f58;
  --eui-gray-500: #6e7781;
  --eui-gray-600: #9aa4ae;
  --eui-gray-700: #4b5560;
  --eui-gray-800: #c0c8d0;
  --eui-gray-900: #e6edf3;

  --eui-shadow-button: 0 1px 2px 0 rgba(0, 0, 0, 0.5);
`;

export const colors = {
  background: 'var(--eui-background)',
  red: '#cf222e',

  primary: {
    foreground: 'var(--eui-primary-foreground)',
    50: 'var(--eui-primary-50)',
    100: 'var(--eui-primary-100)',
    200: 'var(--eui-primary-200)',
    300: 'var(--eui-primary-300)',
    400: 'var(--eui-primary-400)',
    500: 'var(--eui-primary-500)',
    600: 'var(--eui-primary-600)',
    700: 'var(--eui-primary-700)',
    800: 'var(--eui-primary-800)',
    900: 'var(--eui-primary-900)',
  },

  gray: {
    50: 'var(--eui-gray-50)',
    100: 'var(--eui-gray-100)',
    200: 'var(--eui-gray-200)',
    300: 'var(--eui-gray-300)',
    400: 'var(--eui-gray-400)',
    500: 'var(--eui-gray-500)',
    600: 'var(--eui-gray-600)',
    700: 'var(--eui-gray-700)',
    800: 'var(--eui-gray-800)',
    900: 'var(--eui-gray-900)',
  },
};

export const durations = {
  fast: '120ms',
  base: '120ms',
  slow: '280ms',
};

export const easings = {
  standard: 'cubic-bezier(0.4, 0, 0.2, 1)',
};

export const shadows = {
  button: 'var(--eui-shadow-button)',
  focus: '0 0 0 3px color-mix(in oklab, var(--eui-primary-500) 35%, transparent)',
};

export const globalCss = css`
  :root {
    ${lightVariables}
  }

  @media (prefers-color-scheme: dark) {
    :root:not([data-theme]) {
      ${darkVariables}
    }
  }

  [data-theme='dark'] {
    ${darkVariables}
  }
`;
