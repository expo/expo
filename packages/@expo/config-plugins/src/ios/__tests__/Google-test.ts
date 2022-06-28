import { vol } from 'memfs';
import path from 'path';

import {
  getGoogleServicesFile,
  getGoogleSignInReservedClientId,
  setGoogleSignInReservedClientId,
} from '../Google';
import { appendScheme } from '../Scheme';

jest.mock('fs');
jest.mock('../Scheme');

const originalFs = jest.requireActual('fs');

describe('ios google config', () => {
  const projectRoot = '/testproject';

  afterEach(() => vol.reset());

  it(`returns null from all getters if no value provided`, () => {
    expect(getGoogleSignInReservedClientId({}, { projectRoot: null })).toBe(null);
    expect(getGoogleServicesFile({})).toBe(null);
  });

  it(`returns the correct values from all getters if a value is provided`, () => {
    expect(
      getGoogleSignInReservedClientId(
        {
          ios: { config: { googleSignIn: { reservedClientId: '000' } } },
        },
        { projectRoot: null }
      )
    ).toBe('000');
    expect(
      getGoogleServicesFile({ ios: { googleServicesFile: './path/to/GoogleService-Info.plist' } })
    ).toBe('./path/to/GoogleService-Info.plist');
  });

  it(`adds the reserved client id to scheme if provided`, () => {
    vol.fromJSON(
      {
        'path/to/GoogleService-Info.plist': originalFs.readFileSync(
          path.join(__dirname, 'fixtures/GoogleService-Info.plist'),
          'utf-8'
        ),
      },
      projectRoot
    );

    const infoPlist = {};
    setGoogleSignInReservedClientId(
      {
        ios: {
          config: { googleSignIn: { reservedClientId: 'client-id-scheme' } },
          googleServicesFile: './path/to/GoogleService-Info.plist',
        },
      },
      infoPlist,
      { projectRoot }
    );

    expect(appendScheme).toHaveBeenCalledWith('client-id-scheme', infoPlist);
  });

  it(`adds the reserved client id to scheme from GoogleService-Info.Plist`, () => {
    vol.fromJSON(
      {
        'path/to/GoogleService-Info.plist': originalFs.readFileSync(
          path.join(__dirname, 'fixtures/GoogleService-Info.plist'),
          'utf-8'
        ),
      },
      projectRoot
    );

    const infoPlist = {};
    setGoogleSignInReservedClientId(
      {
        ios: { googleServicesFile: './path/to/GoogleService-Info.plist' },
      },
      infoPlist,
      { projectRoot }
    );

    expect(appendScheme).toHaveBeenCalledWith(
      'com.googleusercontent.apps.1234567890123-abcdef',
      infoPlist
    );
  });
});
