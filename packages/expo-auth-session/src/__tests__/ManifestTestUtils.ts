import Constants from 'expo-constants';

export type ConstantsType = typeof Constants;
export type ConstantsWithoutManifests = Omit<ConstantsType, 'manifest' | 'manifest2'>;

export type LegacyManifestPartial = Partial<ConstantsType['manifest']>;
export type NewManifestPartial = Partial<ConstantsType['manifest2']>;

export type LegacyOrNewManifest =
  | {
      manifest: LegacyManifestPartial;
      manifest2: null;
    }
  | {
      manifest: null;
      manifest2: NewManifestPartial;
    };

export const describeManifestTypes =
  (manifest: LegacyManifestPartial, manifest2: NewManifestPartial) =>
  (fn: (manifestObj: LegacyOrNewManifest) => any) =>
    describe.each<[string, LegacyOrNewManifest]>([
      ['legacy', { manifest, manifest2: null }],
      ['new', { manifest: null, manifest2 }],
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
    const expoConfig = mockManifest.manifest
      ? mockManifest.manifest
      : mockManifest.manifest2?.extra?.expoClient;
    return {
      ...ConstantsModule,
      // must explicitly include this in order to mock both default and named exports
      __esModule: true,
      default: {
        ...Constants,
        ...constants,
        ...mockManifest,
        expoConfig,
      },
    };
  });
}
