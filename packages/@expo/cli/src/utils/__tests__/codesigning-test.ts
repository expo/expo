import { vol } from 'memfs';

import { mockExpoRootChain, mockSelfSigned } from './fixtures/certificates';
import { getProjectDevelopmentCertificateAsync } from '../../api/getProjectDevelopmentCertificate';
import { getUserAsync } from '../../api/user/user';
import { getCodeSigningInfoAsync, signManifestString } from '../codesigning';

jest.mock('../../api/user/user');
jest.mock('../../api/graphql/queries/AppQuery', () => ({
  AppQuery: {
    byIdAsync: jest.fn(async () => ({
      id: 'blah',
      scopeKey: 'scope-key',
      ownerAccount: {
        id: 'blah-account',
      },
    })),
  },
}));
jest.mock('../../log');
jest.mock('@expo/code-signing-certificates', () => ({
  ...(jest.requireActual(
    '@expo/code-signing-certificates'
  ) as typeof import('@expo/code-signing-certificates')),
  generateKeyPair: jest.fn(() =>
    (
      jest.requireActual(
        '@expo/code-signing-certificates'
      ) as typeof import('@expo/code-signing-certificates')
    ).convertKeyPairPEMToKeyPair({
      publicKeyPEM: mockExpoRootChain.publicKeyPEM,
      privateKeyPEM: mockExpoRootChain.privateKeyPEM,
    })
  ),
}));
jest.mock('../../api/getProjectDevelopmentCertificate', () => ({
  getProjectDevelopmentCertificateAsync: jest.fn(() => mockExpoRootChain.developmentCertificate),
}));
jest.mock('../../api/getExpoGoIntermediateCertificate', () => ({
  getExpoGoIntermediateCertificateAsync: jest.fn(
    () => mockExpoRootChain.expoGoIntermediateCertificate
  ),
}));

beforeEach(() => {
  vol.reset();

  jest.mocked(getUserAsync).mockImplementation(async () => ({
    __typename: 'User',
    id: 'userwat',
    username: 'wat',
    primaryAccount: { id: 'blah-account' },
    accounts: [],
  }));
});

describe(getCodeSigningInfoAsync, () => {
  beforeEach(() => {
    delete process.env.EXPO_OFFLINE;
  });
  it('returns null when no expo-expect-signature header is requested', async () => {
    await expect(getCodeSigningInfoAsync({} as any, null, undefined)).resolves.toBeNull();
  });

  it('throws when expo-expect-signature header has invalid format', async () => {
    await expect(getCodeSigningInfoAsync({} as any, 'hello', undefined)).rejects.toThrowError(
      'keyid not present in expo-expect-signature header'
    );
    await expect(getCodeSigningInfoAsync({} as any, 'keyid=1', undefined)).rejects.toThrowError(
      'Invalid value for keyid in expo-expect-signature header: 1'
    );
    await expect(
      getCodeSigningInfoAsync({} as any, 'keyid="hello", alg=1', undefined)
    ).rejects.toThrowError('Invalid value for alg in expo-expect-signature header');
  });

  describe('expo-root keyid requested', () => {
    describe('online', () => {
      beforeEach(() => {
        delete process.env.EXPO_OFFLINE;
      });
      afterAll(() => {
        delete process.env.EXPO_OFFLINE;
      });

      it('normal case gets a development certificate', async () => {
        const result = await getCodeSigningInfoAsync(
          { extra: { eas: { projectId: 'testprojectid' } } } as any,
          'keyid="expo-root", alg="rsa-v1_5-sha256"',
          undefined
        );
        expect(result).toMatchSnapshot();
      });

      it('requires easProjectId to be configured', async () => {
        const result = await getCodeSigningInfoAsync(
          { extra: { eas: {} } } as any,
          'keyid="expo-root", alg="rsa-v1_5-sha256"',
          undefined
        );
        expect(result).toBeNull();
      });

      it('falls back to cached when there is a network error', async () => {
        const result = await getCodeSigningInfoAsync(
          { extra: { eas: { projectId: 'testprojectid' } } } as any,
          'keyid="expo-root", alg="rsa-v1_5-sha256"',
          undefined
        );

        jest
          .mocked(getProjectDevelopmentCertificateAsync)
          .mockImplementationOnce(async (): Promise<string> => {
            throw Error('wat');
          });

        const result2 = await getCodeSigningInfoAsync(
          { extra: { eas: { projectId: 'testprojectid' } } } as any,
          'keyid="expo-root", alg="rsa-v1_5-sha256"',
          undefined
        );
        expect(result2).toEqual(result);
      });

      it('throws when it tried to falls back to cached when there is a network error but no cached value exists', async () => {
        jest
          .mocked(getProjectDevelopmentCertificateAsync)
          .mockImplementationOnce(async (): Promise<string> => {
            throw Error('wat');
          });

        await expect(
          getCodeSigningInfoAsync(
            { extra: { eas: { projectId: 'testprojectid' } } } as any,
            'keyid="expo-root", alg="rsa-v1_5-sha256"',
            undefined
          )
        ).rejects.toThrowError('wat');
      });

      it('falls back to cached when offline', async () => {
        const result = await getCodeSigningInfoAsync(
          { extra: { eas: { projectId: 'testprojectid' } } } as any,
          'keyid="expo-root", alg="rsa-v1_5-sha256"',
          undefined
        );
        process.env.EXPO_OFFLINE = '1';
        const result2 = await getCodeSigningInfoAsync(
          { extra: { eas: { projectId: 'testprojectid' } } } as any,
          'keyid="expo-root", alg="rsa-v1_5-sha256"',
          undefined
        );
        expect(result2).toEqual(result);
      });
    });
  });

  describe('expo-go keyid requested', () => {
    it('throws', async () => {
      await expect(
        getCodeSigningInfoAsync({} as any, 'keyid="expo-go"', undefined)
      ).rejects.toThrowError(
        'Invalid certificate requested: cannot sign with embedded keyid=expo-go key'
      );
    });
  });

  describe('non expo-root certificate keyid requested', () => {
    it('normal case gets the configured certificate', async () => {
      vol.fromJSON({
        'certs/cert.pem': mockSelfSigned.certificate,
        'keys/private-key.pem': mockSelfSigned.privateKey,
      });

      const result = await getCodeSigningInfoAsync(
        {
          updates: {
            codeSigningCertificate: 'certs/cert.pem',
            codeSigningMetadata: { keyid: 'test', alg: 'rsa-v1_5-sha256' },
          },
        } as any,
        'keyid="test", alg="rsa-v1_5-sha256"',
        'keys/private-key.pem'
      );
      expect(result).toMatchSnapshot();
    });

    it('throws when private key path is not supplied', async () => {
      await expect(
        getCodeSigningInfoAsync(
          {
            updates: { codeSigningCertificate: 'certs/cert.pem' },
          } as any,
          'keyid="test", alg="rsa-v1_5-sha256"',
          undefined
        )
      ).rejects.toThrowError(
        'Must specify --private-key-path argument to sign development manifest for requested code signing key'
      );
    });

    it('throws when it cannot generate the requested keyid due to no code signing configuration in app.json', async () => {
      await expect(
        getCodeSigningInfoAsync(
          {
            updates: { codeSigningCertificate: 'certs/cert.pem' },
          } as any,
          'keyid="test", alg="rsa-v1_5-sha256"',
          'keys/private-key.pem'
        )
      ).rejects.toThrowError(
        'Must specify "codeSigningMetadata" under the "updates" field of your app config file to use EAS code signing'
      );
    });

    it('throws when it cannot generate the requested keyid due to configured keyid or alg mismatch', async () => {
      await expect(
        getCodeSigningInfoAsync(
          {
            updates: {
              codeSigningCertificate: 'certs/cert.pem',
              codeSigningMetadata: { keyid: 'test2', alg: 'rsa-v1_5-sha256' },
            },
          } as any,
          'keyid="test", alg="rsa-v1_5-sha256"',
          'keys/private-key.pem'
        )
      ).rejects.toThrowError('keyid mismatch: client=test, project=test2');

      await expect(
        getCodeSigningInfoAsync(
          {
            updates: {
              codeSigningCertificate: 'certs/cert.pem',
              codeSigningMetadata: { keyid: 'test', alg: 'fake' },
            },
          } as any,
          'keyid="test", alg="fake2"',
          'keys/private-key.pem'
        )
      ).rejects.toThrowError('"alg" field mismatch (client=fake2, project=fake)');
    });

    it('throws when it cannot load configured code signing info', async () => {
      await expect(
        getCodeSigningInfoAsync(
          {
            updates: {
              codeSigningCertificate: 'certs/cert.pem',
              codeSigningMetadata: { keyid: 'test', alg: 'rsa-v1_5-sha256' },
            },
          } as any,
          'keyid="test", alg="rsa-v1_5-sha256"',
          'keys/private-key.pem'
        )
      ).rejects.toThrowError('Code signing certificate cannot be read from path: certs/cert.pem');
    });
  });
});

describe(signManifestString, () => {
  beforeEach(() => {
    delete process.env.EXPO_OFFLINE;
  });
  it('generates signature', () => {
    expect(
      signManifestString('hello', {
        keyId: 'test',
        certificateChainForResponse: [],
        certificateForPrivateKey: mockSelfSigned.certificate,
        privateKey: mockSelfSigned.privateKey,
        scopeKey: null,
      })
    ).toMatchSnapshot();
  });
  it('validates generated signature against certificate', () => {
    expect(() =>
      signManifestString('hello', {
        keyId: 'test',
        certificateChainForResponse: [],
        certificateForPrivateKey: '',
        privateKey: mockSelfSigned.privateKey,
        scopeKey: null,
      })
    ).toThrowError('Invalid PEM formatted message.');
  });
});
