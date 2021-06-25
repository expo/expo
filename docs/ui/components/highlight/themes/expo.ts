import { theme, darkTheme, lightTheme } from '@expo/styleguide';
import { PrismTheme } from 'prism-react-renderer';

export const expoTheme = createTheme(theme);
export const darkExpoTheme = createTheme(darkTheme);
export const lightExpoTheme = createTheme(lightTheme);

function createTheme(expoTheme: typeof theme): PrismTheme {
  return {
    plain: {
      color: expoTheme.text.default,
      backgroundColor: expoTheme.background.secondary,
    },
    styles: [
      {
        types: ['comment', 'block-comment', 'prolog', 'doctype', 'cdata'],
        style: { color: expoTheme.code.comment },
      },
      {
        types: ['punctuation'],
        style: { color: expoTheme.code.punctuation },
      },
      {
        types: [
          'property',
          'tag',
          'boolean',
          'number',
          'function-name',
          'constant',
          'symbol',
          'deleted',
        ],
        style: { color: expoTheme.code.property },
      },
      {
        types: ['selector', 'attr-name', 'string', 'char', 'function', 'builtin', 'inserted'],
        style: { color: expoTheme.code.builtin },
      },
      {
        types: ['operator', 'entity', 'url', 'variable'],
        style: { color: expoTheme.code.operator },
      },
      {
        types: ['atrule', 'attr-value', 'keyword', 'class-name'],
        style: { color: expoTheme.code.keyword },
      },
      {
        types: ['regex', 'important'],
        style: { color: expoTheme.code.regex },
      },
      {
        types: ['entity'],
        style: { cursor: 'help' },
      },
      {
        types: ['namespace'],
        style: { opacity: 0.7 },
      },
      {
        types: ['important'],
        style: { fontWeight: 'bold' },
      },
      {
        types: ['string'],
        languages: ['css'],
        style: { color: expoTheme.code.string },
      },
    ],
  };
}
