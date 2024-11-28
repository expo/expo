import { RuleTester } from '@typescript-eslint/rule-tester';

import { noDynamicEnvVar } from '../rules/noDynamicEnvVar';

const ruleTester = new RuleTester({
  languageOptions: {
    parserOptions: {
      ecmaFeatures: {
        jsx: true,
      },
    },
  },
});

ruleTester.run('noDynamicEnvVar', noDynamicEnvVar, {
  valid: [{ code: 'const myVar = process.env.MY_VAR;' }],
  invalid: [
    {
      code: 'const myVar = process.env["MY_VAR"]',
      errors: [
        {
          messageId: 'unexpectedDynamicAccess',
          data: {
            value: 'MY_VAR',
          },
        },
      ],
    },
    {
      code: 'const dynamicVar = "MY_VAR"; const myVar = process.env[dynamicVar];',
      errors: [
        {
          messageId: 'unexpectedDynamicAccess',
          data: {
            value: 'dynamicVar',
          },
        },
      ],
    },
  ],
});
