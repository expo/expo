import Schemer from '../src/index';

const schema = require('./files/schema.json').schema;
const S = new Schemer(schema, { rootDir: './__tests__' });

describe('Remote', () => {
  it('Icon', async () => {
    expect(
      await S.validateIcon(
        'https://upload.wikimedia.org/wikipedia/commons/0/0f/Icon_Pinguin_2_512x512.png'
      )
    ).toEqual(undefined);
  });

  it('Remote icon dimensions correct', async () => {
    const S = new Schemer({
      properties: {
        icon: {
          meta: { asset: true, dimensions: { width: 100, height: 100 } },
        },
      },
    });
    expect(await S.validateIcon('https://httpbin.org/image/png')).toEqual(undefined);
  });

  it('Remote icon dimensions wrong', async () => {
    let didError = false;
    const S = new Schemer(
      {
        properties: {
          icon: {
            meta: {
              asset: true,
              dimensions: { width: 101, height: 100 },
              contentTypePattern: '^image/png$',
            },
          },
        },
      },
      { rootDir: './__tests__' }
    );
    try {
      await S.validateIcon('https://httpbin.org/image/png');
    } catch (e) {
      didError = true;
      expect(e).toBeTruthy();
      expect(e.errors.length).toBe(1);
      expect(
        e.errors.map(validationError => {
          const { stack, ...rest } = validationError;
          return rest;
        })
      ).toMatchSnapshot();
    }

    expect(didError).toBe(true);
  });
});
