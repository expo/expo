import Constants from 'expo-constants';

export type ConstantsType = typeof Constants;
export type ConstantsWithoutManifests = Omit<ConstantsType, 'manifest' | 'manifest2'>;

export type NewManifestPartial = Partial<ConstantsType['manifest2']>;

export type NewManifestShape = {
  manifest: null;
  __unsafeNoWarnManifest: null;
  manifest2: NewManifestPartial;
  __unsafeNoWarnManifest2: NewManifestPartial;
};

export const describeManifest =
  (manifest: NewManifestPartial) => (fn: (manifestObj: NewManifestShape) => any) =>
    describe.each<[NewManifestShape]>([
      [
        {
          manifest: null,
          __unsafeNoWarnManifest: null,
          manifest2: manifest,
          __unsafeNoWarnManifest2: manifest,
        },
      ],
    ])('mocking constants manifest', (manifestObj) => fn(manifestObj));

/**
 * Use of this requires use of `require` for the module that imports `expo-constants`
 */
export function mockConstants(
  constants: Partial<ConstantsWithoutManifests>,
  mockManifest: NewManifestShape
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
