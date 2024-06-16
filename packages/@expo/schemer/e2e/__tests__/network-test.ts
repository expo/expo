import Schemer from '../..';

it('validates corrent icon hosted remotely', async () => {
  const schema = require('../fixtures/schema.json').schema;
  const validator = new Schemer(schema, { rootDir: './__tests__' });

  await expect(
    validator.validateIcon(
      'https://upload.wikimedia.org/wikipedia/commons/0/0f/Icon_Pinguin_2_512x512.png'
    )
  ).resolves.toBeUndefined();
});

it('validates correct asset dimensions hosted remotely', async () => {
  const validator = new Schemer({
    properties: {
      icon: {
        meta: {
          asset: true,
          contentTypePattern: '^image/png$',
          dimensions: { width: 100, height: 100 },
        },
      },
    },
  });

  await expect(validator.validateIcon('https://httpbin.org/image/png')).resolves.toBeUndefined();
});

it('validates incorrect asset dimensions hosted remotely', async () => {
  const validator = new Schemer({
    properties: {
      icon: {
        meta: {
          asset: true,
          contentTypePattern: '^image/png$',
          dimensions: { width: 101, height: 100 },
        },
      },
    },
  });

  await expect(validator.validateIcon('https://httpbin.org/image/png')).rejects.toThrowError(
    `'icon' should have dimensions 101x100, but the file at 'https://httpbin.org/image/png' has dimensions 100x100`
  );
});
