import { RuleTester } from '@typescript-eslint/rule-tester';

import { noSensitivePublicEnvVar } from '../rules/no-sensitive-public-env-var';

const ruleTester = new RuleTester({
  languageOptions: {
    parserOptions: {
      ecmaFeatures: {
        jsx: true,
      },
    },
  },
});

ruleTester.run('noSensitivePublicEnvVar', noSensitivePublicEnvVar, {
  valid: [
    // Configuration, not credentials.
    { code: 'const url = process.env.EXPO_PUBLIC_API_URL;' },
    { code: 'const flag = process.env.EXPO_PUBLIC_ENABLE_BETA;' },
    { code: 'const name = process.env.EXPO_PUBLIC_APP_NAME;' },
    // Not public, so not inlined.
    { code: 'const secret = process.env.STRIPE_SECRET_KEY;' },
    { code: 'const token = process.env.AUTH_TOKEN;' },
    // A word merely containing a sensitive substring is not a match.
    { code: 'const monkey = process.env.EXPO_PUBLIC_MONKEY;' },
    { code: 'const authority = process.env.EXPO_PUBLIC_AUTHORITY;' },
    // Dynamic access is covered by no-dynamic-env-var, not this rule.
    { code: 'const value = process.env["EXPO_PUBLIC_API_KEY"];' },
    // Explicitly allowed.
    {
      code: 'const key = process.env.EXPO_PUBLIC_MAPS_KEY;',
      options: [{ allow: ['EXPO_PUBLIC_MAPS_KEY'] }],
    },
  ],
  invalid: [
    {
      code: 'const key = process.env.EXPO_PUBLIC_API_KEY;',
      errors: [
        {
          messageId: 'sensitivePublicEnvVar',
          data: { name: 'EXPO_PUBLIC_API_KEY' },
        },
      ],
    },
    {
      code: 'const secret = process.env.EXPO_PUBLIC_STRIPE_SECRET_KEY;',
      errors: [{ messageId: 'sensitivePublicEnvVar' }],
    },
    {
      code: 'fetch(url, { headers: { Authorization: process.env.EXPO_PUBLIC_AUTH_TOKEN } });',
      errors: [{ messageId: 'sensitivePublicEnvVar' }],
    },
    {
      code: 'const pw = process.env.EXPO_PUBLIC_DB_PASSWORD;',
      errors: [{ messageId: 'sensitivePublicEnvVar' }],
    },
    {
      code: 'const pk = process.env.EXPO_PUBLIC_PRIVATE_KEY;',
      errors: [{ messageId: 'sensitivePublicEnvVar' }],
    },
    {
      code: 'const id = process.env.EXPO_PUBLIC_TENANT_ID;',
      options: [{ additionalPatterns: ['TENANT_ID$'] }],
      errors: [{ messageId: 'sensitivePublicEnvVar' }],
    },
  ],
});
