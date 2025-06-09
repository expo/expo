import {
  serializeOptimizeAsync,
  serializeShakingAsync,
} from '../fork/__tests__/serializer-test-utils';

jest.mock('../exportHermes', () => {
  return {
    buildHermesBundleAsync: jest.fn(({ code, map }) => ({
      hbc: code,
      sourcemap: map,
    })),
  };
});

jest.mock('../findUpPackageJsonPath', () => ({
  findUpPackageJsonPath: jest.fn(() => null),
}));

it(`can import .env files as modules with tree shaking in production`, async () => {
  const [, artifacts] = await serializeShakingAsync({
    'index.js': `
import env from "./.env";
import env2 from "./.env.local";
console.log(env, env2);
            `,
    '.env': `
SECRET_VALUE=secret
EXPO_PUBLIC_DEFAULT_ICON_COLOR=foo
`,
    '.env.local': `
EXPO_PUBLIC_LOCAL=.env.local
`,
  });

  expect(artifacts[0].source).not.toMatch('SECRET_VALUE');
  expect(artifacts[0].source).toMatch('EXPO_PUBLIC_DEFAULT_ICON_COLOR');
  expect(artifacts[0].source).toMatch('"EXPO_PUBLIC_LOCAL": ".env.local"');
});

it(`can format multi-line .env files as modules`, async () => {
  const [, artifacts] = await serializeShakingAsync({
    'index.js': `
import env from "./.env";
console.log(env);
            `,
    '.env': `
# comments
 
EXPO_PUBLIC_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----
...
xxx...
...
-----END PRIVATE KEY-----"
`,
  });

  expect(artifacts[0].source).toMatch('EXPO_PUBLIC_PRIVATE_KEY');
  // Ensure multi-line formatting is preserved.
  expect(artifacts[0].source).toMatch('-----\\n...\\nxxx...');
});

it(`can import secret values in server bundles`, async () => {
  const [, artifacts] = await serializeShakingAsync(
    {
      'index.js': `
import env from "./.env";
console.log(env);
            `,
      '.env': ` 
SECRET=hey
EXPO_PUBLIC_FOO=bar
`,
    },
    {
      isReactServer: true,
    }
  );

  expect(artifacts[0].source).toMatch('SECRET');
  expect(artifacts[0].source).toMatch('EXPO_PUBLIC_FOO');
});

it(`can import env vars from any position in the fs`, async () => {
  const [, artifacts] = await serializeShakingAsync({
    'index.js': `
import env from "./foo/.env";
console.log(env);
            `,
    'foo/.env': ` 
EXPO_PUBLIC_FOO=bar
`,
  });

  expect(artifacts[0].source).toMatch('EXPO_PUBLIC_FOO":');
});

it(`will import corrupt files if the name is not supported`, async () => {
  const [, artifacts] = await serializeShakingAsync({
    'index.js': `
import env from "./.env.unknown";
console.log(env);
            `,
    '.env.unknown': ` 
EXPO_PUBLIC_FOO=bar
`,
  });

  expect(artifacts[0].source).toMatch('EXPO_PUBLIC_FOO = bar;');
});

it(`creates virtual expo env var module in production`, async () => {
  const [, artifacts] = await serializeShakingAsync({
    'index.js': `
import {env} from "./pkg/expo/virtual/env";
console.log(env);
            `,
    'pkg/expo/virtual/env.js': ``,
    '.env': ` 
EXPO_PUBLIC_FOO=bar
`,
  });

  expect(artifacts[0].source).toMatch('Attempting to access internal environment');
});

it(`creates virtual expo env var module in development`, async () => {
  await expect(
    serializeOptimizeAsync(
      {
        'index.js': `
import {env} from "./pkg/expo/virtual/env";
console.log(env);
            `,
        'pkg/expo/virtual/env.js': ``,
        '.env': ` 
EXPO_PUBLIC_FOO=bar
`,
      },
      {
        dev: true,
      }
    )
  ).rejects.toThrow(/mini-metro runner doesn't support require context/);
});
