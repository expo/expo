import Constants from 'expo-constants';
import { Platform } from 'react-native';

import { checkFingerprintAsync } from '../checkFingerprintAsync';

jest.mock('expo-constants', () => ({ __esModule: true, default: { fingerprint: null } }));
jest.mock('../checkFingerprintAsync', () => ({
  checkFingerprintAsync: jest.fn(async () => ({ status: 'up-to-date' })),
}));

function announce({ embedded }: { embedded: string | null }) {
  (Constants as any).fingerprint = embedded;
  jest.isolateModules(() => {
    require('../announceFingerprint');
  });
}

beforeEach(() => {
  jest.mocked(checkFingerprintAsync).mockClear();
});

// The jest-expo preset runs this file for every platform; the web project resolves the no-op
// `announceFingerprint.ts` instead of the `.native.ts` module tested here.
const itNative = Platform.OS === 'ios' || Platform.OS === 'android' ? it : it.skip;

describe('announceFingerprint', () => {
  itNative(`announces through the check when the app has an embedded fingerprint`, () => {
    announce({ embedded: 'embedded-hash' });
    expect(checkFingerprintAsync).toHaveBeenCalledTimes(1);
  });

  itNative(`stays quiet without an embedded fingerprint`, () => {
    // Asking would make the dev server compute a project fingerprint that nothing can use.
    announce({ embedded: null });
    expect(checkFingerprintAsync).not.toHaveBeenCalled();
  });

  if (Platform.OS === 'web') {
    it(`does nothing on web`, () => {
      announce({ embedded: 'embedded-hash' });
      expect(checkFingerprintAsync).not.toHaveBeenCalled();
    });
  }
});
