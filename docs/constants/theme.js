import { colors as styleguideColors } from '@expo/styleguide';

export const colors = {
  temporary: '#FF0000',
  border: '#ECECEC',
  grey: '#F3F3F3',
  darkGrey: 'rgba(153, 153, 165, 1)',
  codeWhite: '#F8F8F2',
  white: '#FFFFFF',
  white80: 'rgba(255, 255, 255, 0.8)',
  white70: 'rgba(255, 255, 255, 0.7)',
  white50: 'rgba(255, 255, 255, 0.5)',
  white20: 'rgba(255, 255, 255, 0.2)',
  white10: 'rgba(255, 255, 255, 0.1)',
  black: 'rgba(0, 0, 32, 1)',
  black90: 'rgba(0, 0, 32, 0.9)',
  black80: 'rgba(0, 0, 32, 0.8)',
  black60: 'rgba(0, 0, 32, 0.6)',
  black50: 'rgba(0, 0, 32, 0.5)',
  black40: 'rgba(0, 0, 32, 0.4)',
  black30: 'rgba(0, 0, 32, 0.3)',
  black10: 'rgba(0, 0, 32, 0.1)',
  black08: 'rgba(0, 0, 32, 0.08)',
  expo: '#4630EB',
  expoLighter: '#5844ed',
  lila: '#A3A1F7',
  lilaLighter: 'rgba(163, 161, 247, 0.4)',
  portage: 'rgba(163, 161, 247, 0.18)',
  blackRussian: 'rgba(0, 1, 31, 0.03)',
  orange: '#FFBB83',
  yellow: '#FFDB8A',
  red: '#dc3545',
  green: '#28a745',
};

export const expoColors = styleguideColors;

export const fonts = {
  bold: 'expo-brand-bold',
  book: 'expo-brand-book',
  demi: 'expo-brand-demi',
  mono: 'expo-brand-mono',
};

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const fontStack = `system-ui,-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',Arial,'Noto Sans',sans-serif,'Apple Color Emoji','Segoe UI Emoji','Segoe UI Symbol','Noto Color Emoji'`;

export const fontFamilies = {
  bold: `${fonts.bold}`,
  book: `${fonts.book}`,
  demi: `${fonts.demi}`,
  mono: `${fonts.mono}, Monaco,Consolas,'Liberation Mono','Courier New',monospace, 'Apple Color Emoji','Segoe UI Emoji','Segoe UI Symbol','Noto Color Emoji'`,
};

export const breakpoints = {
  mobile: '1024px',
  mobileStrict: '748px',
  mobileStrictValue: 748,
  mobileValue: 1024,
};
