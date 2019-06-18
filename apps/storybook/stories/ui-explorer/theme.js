const lightSyntaxColors = {
  green1: '#008000',
  red1: '#A31515',
  red2: '#9a050f',
  red3: '#800000',
  red4: '#ff0000',
  gray1: '#393A34',
  cyan1: '#36acaa',
  cyan2: '#2B91AF',
  blue1: '#0000ff',
  blue2: '#00009f',
};

const colors = {
  // Official color palette
  primary: '#FF4785',
  secondary: '#1EA7FD',
  tertiary: '#FAFBFC',
  ancillary: '#22a699',
  // Complimentary
  orange: '#FC521F',
  gold: '#FFAE00',
  green: '#66BF3C',
  seafoam: '#37D5D3',
  purple: '#6F2CAC',
  ultraviolet: '#2A0481',
  // Monochrome
  lightest: '#FFFFFF',
  lighter: '#F8F8F8',
  light: '#F3F3F3',
  mediumlight: '#EEEEEE',
  medium: '#DDDDDD',
  mediumdark: '#999999',
  dark: '#666666',
  darker: '#444444',
  darkest: '#333333',
  // For borders
  border: 'rgba(0,0,0,.1)',
  // Status
  positive: '#66BF3C',
  negative: '#FF4400',
  warning: '#E69D00',
  defaultText: '#333333',
  inverseText: '#FFFFFF',
};
export default {
  colorPrimary: '#4630EB',
  colorSecondary: '#4630EB',

  // UI
  appBg: '#F3F3F3',
  appContentBg: 'white',
  appBorderColor: 'grey',
  appBorderRadius: 4,

  // Typography
  fontBase: '"Open Sans", sans-serif',
  fontCode: 'monospace',

  // Text colors
  textColor: 'rgba(0, 0, 32, 0.9)',
  textInverseColor: 'rgba(255,255,255,0.9)',

  // Toolbar default and active colors
  barTextColor: 'rgba(0, 0, 32, 0.9)',
  barSelectedColor: '#4630EB',
  barBg: 'white',

  // Form colors
  inputBg: '#FFFFFF',
  inputBorder: 'rgba(0,0,0,.1)',
  inputBorderRadius: 4,
  inputTextColor: '#333333',

  code: {
    colors: lightSyntaxColors,
    // mono: fontCode,
  },
  color: colors,
  background: {
    app: '#F6F9FC',
    content: '#FFFFFF',
    hoverable: 'rgba(0,0,0,.05)',
    // Notification, error, and warning backgrounds
    positive: '#E1FFD4',
    negative: '#FEDED2',
    warning: '#FFF5CF',
  },
  typography: {
    fonts: {
      base: [
        '"Nunito Sans"',
        '-apple-system',
        '".SFNSText-Regular"',
        '"San Francisco"',
        'BlinkMacSystemFont',
        '"Segoe UI"',
        '"Helvetica Neue"',
        'Helvetica',
        'Arial',
        'sans-serif',
      ].join(', '),
      mono: [
        '"Operator Mono"',
        '"Fira Code Retina"',
        '"Fira Code"',
        '"FiraCode-Retina"',
        '"Andale Mono"',
        '"Lucida Console"',
        'Consolas',
        'Monaco',
        'monospace',
      ].join(', '),
    },
    weight: {
      regular: 400,
      bold: 700,
      black: 900,
    },
    size: {
      s1: 12,
      s2: 14,
      s3: 16,
      m1: 20,
      m2: 24,
      m3: 28,
      l1: 32,
      l2: 40,
      l3: 48,
      code: 90,
    },
  },
};
