import { vol } from 'memfs';
import path from 'path';

import { DeviceABI, getDeviceABIsAsync } from '../../../start/platforms/android/adb';
import { resolveInstallApkPathAsync } from '../resolveInstallApkPath';

jest.mock('../../../start/platforms/android/adb', () => ({
  DeviceABI: jest.requireActual('../../../start/platforms/android/adb').DeviceABI,
  getDeviceABIsAsync: jest.fn(),
}));

const device = { name: 'Test', pid: '1' };
const directory = '/custom outputs/preview';

type Element = { outputFile: string; filters?: { filterType: string; value: string }[] };

function writeArtifacts(elements: Element[]): string[] {
  const files: Record<string, string> = {
    [path.join(directory, 'output-metadata.json')]: JSON.stringify({ elements }),
  };
  for (const element of elements) files[path.join(directory, element.outputFile)] = 'apk';
  vol.fromJSON(files, '/');
  return elements.map((element) => path.join(directory, element.outputFile));
}

beforeEach(() => {
  jest.mocked(getDeviceABIsAsync).mockResolvedValue([DeviceABI.arm64v8a, DeviceABI.x8664]);
});
afterEach(() => vol.reset());

it('uses a custom APK path reported by Compile', async () => {
  const paths = writeArtifacts([{ outputFile: 'custom-app-1.0.apk' }]);
  await expect(resolveInstallApkPathAsync(device, paths)).resolves.toBe(paths[0]);
});

it.each([
  { abis: [DeviceABI.arm64v8a, DeviceABI.x8664], outputFile: 'arm.apk' },
  { abis: [DeviceABI.x8664, DeviceABI.arm64v8a], outputFile: 'x86.apk' },
])('prefers the first supported device ABI: $abis', async ({ abis, outputFile }) => {
  jest.mocked(getDeviceABIsAsync).mockResolvedValueOnce(abis);
  const paths = writeArtifacts([
    { outputFile: 'universal.apk', filters: [] },
    { outputFile: 'x86.apk', filters: [{ filterType: 'ABI', value: 'x86_64' }] },
    { outputFile: 'arm.apk', filters: [{ filterType: 'ABI', value: 'arm64-v8a' }] },
  ]);
  await expect(resolveInstallApkPathAsync(device, paths)).resolves.toBe(
    path.join(directory, outputFile)
  );
});

it('uses the universal APK when no ABI-specific APK matches', async () => {
  const paths = writeArtifacts([
    { outputFile: 'universal.apk', filters: [] },
    { outputFile: 'unsupported.apk', filters: [{ filterType: 'ABI', value: 'armeabi-v7a' }] },
  ]);
  await expect(resolveInstallApkPathAsync(device, paths)).resolves.toBe(paths[0]);
});

it('returns null for an APK that does not support the device ABI', async () => {
  const paths = writeArtifacts([
    { outputFile: 'unsupported.apk', filters: [{ filterType: 'ABI', value: 'armeabi-v7a' }] },
  ]);
  await expect(resolveInstallApkPathAsync(device, paths)).resolves.toBeNull();
});

it('does not select an unreported APK even if metadata and disk contain it', async () => {
  const paths = writeArtifacts([
    { outputFile: 'stale.apk', filters: [] },
    { outputFile: 'current.apk', filters: [] },
  ]);
  await expect(resolveInstallApkPathAsync(device, paths.slice(1))).resolves.toBe(paths[1]);
});

it('does not select a reported APK that no longer exists', async () => {
  const paths = writeArtifacts([{ outputFile: 'removed.apk' }]);
  vol.unlinkSync(paths[0]!);
  await expect(resolveInstallApkPathAsync(device, paths)).resolves.toBeNull();
});

const unsupportedOutputs: Element[][] = [
  [],
  [{ outputFile: 'one.apk' }, { outputFile: 'two.apk' }],
  [{ outputFile: 'density.apk', filters: [{ filterType: 'DENSITY', value: 'hdpi' }] }],
  [{ outputFile: 'language.apk', filters: [{ filterType: 'LANGUAGE', value: 'en' }] }],
  [
    {
      outputFile: 'combined.apk',
      filters: [
        { filterType: 'ABI', value: 'arm64-v8a' },
        { filterType: 'DENSITY', value: 'hdpi' },
      ],
    },
  ],
];
it.each(unsupportedOutputs.map((elements) => ({ elements })))(
  'defers unsupported or ambiguous APK selection to Gradle: $elements',
  async ({ elements }) => {
    const paths = writeArtifacts(elements);
    await expect(resolveInstallApkPathAsync(device, paths)).resolves.toBeNull();
  }
);

it.each([
  'not json',
  '{}',
  '{"elements":{}}',
  '{"elements":[null]}',
  '{"elements":[{"outputFile":9}]}',
  '{"elements":[{"outputFile":"app.apk","filters":[null]}]}',
])('returns null when APK metadata is invalid: %s', async (metadata) => {
  const paths = writeArtifacts([{ outputFile: 'app.apk' }]);
  vol.writeFileSync(path.join(directory, 'output-metadata.json'), metadata);
  await expect(resolveInstallApkPathAsync(device, paths)).resolves.toBeNull();
});

it('returns null when APK metadata is missing', async () => {
  const paths = writeArtifacts([{ outputFile: 'app.apk' }]);
  vol.unlinkSync(path.join(directory, 'output-metadata.json'));
  await expect(resolveInstallApkPathAsync(device, paths)).resolves.toBeNull();
});
