import { vol } from 'memfs';

import { getUserDefinedFile } from '../publicFolder';

beforeEach(() => vol.reset());

describe(getUserDefinedFile, () => {
  it(`returns null when no favicon is defined`, () => {
    vol.fromJSON({}, '/');

    const faviconFile = getUserDefinedFile('/', ['favicon.ico']);

    expect(faviconFile).toBeNull();
  });

  it(`returns the favicon file when defined`, () => {
    vol.fromJSON(
      {
        'public/favicon.ico': '...',
      },
      '/'
    );

    expect(getUserDefinedFile('/', ['favicon.ico'])).toBe('/public/favicon.ico');
  });
});
