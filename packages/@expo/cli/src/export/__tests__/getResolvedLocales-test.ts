import { vol } from 'memfs';

import { getResolvedLocalesAsync } from '../getResolvedLocales';

describe(getResolvedLocalesAsync, () => {
  it(`resolves nothing if locales are not defined`, async () => {
    expect(await getResolvedLocalesAsync('/', {})).toEqual({});
  });
  it(`resolves locales`, async () => {
    vol.fromJSON(
      {
        'foobar.json': JSON.stringify({ foo: 'bar' }),
        'foobar2.json': JSON.stringify({ bar: true }),
      },
      '/'
    );
    expect(
      await getResolvedLocalesAsync('/', {
        locales: {
          'en-US': './foobar.json',
          'nl-NL': './foobar2.json',
        },
      })
    ).toEqual({
      'en-US': {
        foo: 'bar',
      },
      'nl-NL': {
        bar: true,
      },
    });
  });
});
