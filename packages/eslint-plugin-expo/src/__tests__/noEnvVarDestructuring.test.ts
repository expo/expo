import { RuleTester } from '@typescript-eslint/rule-tester';

import { noEnvVarDestructuring } from '../rules/noEnvVarDestructuring';

const ruleTester = new RuleTester({
  languageOptions: {
    parserOptions: {
      ecmaFeatures: {
        jsx: true,
      },
    },
  },
});

ruleTester.run('noEnvVarDestructuring', noEnvVarDestructuring, {
  valid: [
    {
      code: 'const myVar = process.env.MY_VAR;',
    },
    {
      code: "const food = 'potato';",
    },
  ],

  invalid: [
    {
      code: 'const { MY_VAR } = process.env;',
      errors: [
        {
          messageId: 'unexpectedDestructuring',
          data: {
            value: 'MY_VAR',
          },
        },
      ],
    },
    {
      code: 'const { MY_VAR, ANOTHER_VAR } = process.env;',
      errors: [
        {
          messageId: 'unexpectedDestructuring',
          data: {
            value: 'MY_VAR',
          },
        },
        {
          messageId: 'unexpectedDestructuring',
          data: {
            value: 'ANOTHER_VAR',
          },
        },
      ],
    },
  ],
});
