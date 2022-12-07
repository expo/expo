import { vol } from 'memfs';
import path from 'path';

import {
  getGoogleServicesFile,
  getGoogleSignInReversedClientId,
  setGoogleSignInReversedClientId,
} from '../Google';
import { appendScheme } from '../Scheme';

jest.mock('fs');
jest.mock('../Scheme', () => ({
  appendScheme: jest.fn((...props) => jest.requireActual('../Scheme').appendScheme(...props)),
}));

const googleServicesFixture = jest
  .requireActual('fs')
  .readFileSync(path.join(__dirname, 'fixtures/GoogleService-Info.plist'), 'utf-8');

describe(getGoogleSignInReversedClientId, () => {
  afterEach(() => vol.reset());
  it(`returns null when no file is defined`, () => {
    expect(getGoogleSignInReversedClientId({}, { projectRoot: '' })).toBe(null);
    expect(getGoogleServicesFile({})).toBe(null);
  });
  it(`returns the REVERSED_CLIENT_ID from the linked file`, () => {
    vol.fromJSON(
      {
        'path/to/GoogleService-Info.plist': googleServicesFixture,
      },
      '/'
    );

    const config = {
      ios: { googleServicesFile: './path/to/GoogleService-Info.plist' },
    };

    expect(getGoogleServicesFile(config)).toBe('./path/to/GoogleService-Info.plist');
    expect(getGoogleSignInReversedClientId(config, { projectRoot: '/' })).toBe(
      'com.googleusercontent.apps.1234567890123-abcdef'
    );
  });
});

describe(setGoogleSignInReversedClientId, () => {
  afterEach(() => vol.reset());

  it(`adds the reversed client id to scheme from GoogleService-Info.Plist`, () => {
    vol.fromJSON(
      {
        'path/to/GoogleService-Info.plist': googleServicesFixture,
      },
      '/'
    );

    expect(
      setGoogleSignInReversedClientId(
        {
          ios: { googleServicesFile: './path/to/GoogleService-Info.plist' },
        },
        {},
        { projectRoot: '/' }
      )
    ).toEqual({
      CFBundleURLTypes: [
        { CFBundleURLSchemes: ['com.googleusercontent.apps.1234567890123-abcdef'] },
      ],
    });

    expect(appendScheme).toHaveBeenCalledWith(
      'com.googleusercontent.apps.1234567890123-abcdef',
      {}
    );
  });
});
