import { RuleTester } from '@typescript-eslint/rule-tester';

import { useDomExports } from '../rules/use-dom-exports';

const ruleTester = new RuleTester({
  languageOptions: {
    parserOptions: {
      ecmaFeatures: {
        jsx: true,
      },
    },
  },
});

ruleTester.run('use-dom-exports', useDomExports, {
  valid: [
    {
      code: 'const myVar = process.env.MY_VAR;',
    },
    {
      code: "'use dom';export default function App() {}",
    },
    {
      code: "'use dom';export type Foo='bar'; export interface FI {}; export default function App() {}",
    },
    {
      code: "'use dom';const foo = function () {}; export default foo;",
    },
    {
      code: "'use dom';export { default } from './other';",
    },
    {
      code: "'use dom';export default () => {}",
    },
  ],

  invalid: [
    {
      code: '"use dom"; export { default, other } from "./foo"',
      errors: [
        {
          messageId: 'noOtherExports',
        },
      ],
    },
    {
      code: '"use dom"; export const foo = 1;',
      errors: [
        {
          messageId: 'missingDefaultExport',
        },
        {
          messageId: 'noOtherExports',
        },
      ],
    },
    {
      code: '"use dom"; export default async function App() {}',
      errors: [
        {
          messageId: 'asyncDefaultExport',
        },
      ],
    },
  ],
});
