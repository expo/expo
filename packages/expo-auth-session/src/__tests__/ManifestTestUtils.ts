import Constants from 'expo-constants';

export type ConstantsType = typeof Constants;
export type ConstantsWithoutManifests = Omit<ConstantsType, 'manifest' | 'manifest2'>;

export type LegacyManifestPartial = Partial<ConstantsType['manifest']>;
export type NewManifestPartial = Partial<ConstantsType['manifest2']>;

export type LegacyOrNewManifest =
  | {
      manifest: LegacyManifestPartial;
      __unsafeNoWarnManifest: LegacyManifestPartial;
      manifest2: null;
      __unsafeNoWarnManifest2: null;
    }
  | {
      manifest: null;
      __unsafeNoWarnManifest: null;
      manifest2: NewManifestPartial;
      __unsafeNoWarnManifest2: NewManifestPartial;
    };

export const describeManifestTypes =
  (manifest: LegacyManifestPartial, manifest2: NewManifestPartial) =>
  (fn: (manifestObj: LegacyOrNewManifest) => any) =>
    describe.each<[string, LegacyOrNewManifest]>([
      [
        'legacy',
        {
          manifest,
          __unsafeNoWarnManifest: manifest,
          manifest2: null,
          __unsafeNoWarnManifest2: null,
        },
      ],
      [
        'new',
        {
          manifest: null,
          __unsafeNoWarnManifest: null,
          manifest2,
          __unsafeNoWarnManifest2: manifest2,
        },
      ],
    ])('manifest type %p', (_, manifestObj) => fn(manifestObj));

/**
 * Use of this requires use of `require` for the module that imports `expo-constants`
 */
export function mockConstants(
  constants: Partial<ConstantsWithoutManifests>,
  mockManifest: LegacyOrNewManifest
): void {
  jest.doMock('expo-constants', () => {
    const ConstantsModule = jest.requireActual('expo-constants');
    const { default: Constants } = ConstantsModule;

    if ('manifest' in Constants) {
      delete Constants['manifest'];
    }

    const expoConfig = mockManifest.manifest
      ? mockManifest.manifest
      : mockManifest.manifest2?.extra?.expoClient;
    const expoGoConfig = mockManifest.manifest
      ? mockManifest.manifest
      : mockManifest.manifest2?.extra?.expoGo;
    const easConfig = mockManifest.manifest
      ? mockManifest.manifest
      : mockManifest.manifest2?.extra?.eas;
    return {
      ...ConstantsModule,
      // must explicitly include this in order to mock both default and named exports
      __esModule: true,
      default: {
        ...Constants,
        ...constants,
        ...mockManifest,
        expoConfig,
        expoGoConfig,
        easConfig,
      },
    };
  });
}
