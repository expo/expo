import NativeModule from '../ExpoAI';
import { createSessionAsync, getAvailabilityAsync } from '../LanguageModels';

jest.mock('../ExpoAI', () => ({
  __esModule: true,
  default: { getAvailabilityAsync: jest.fn(), createSessionAsync: jest.fn() },
}));

const nativeModule = jest.mocked(NativeModule!);
const capabilities = {
  provider: 'apple-foundation-models',
  model: null,
  execution: 'on-device',
  constrainedOutput: 'supported',
  runtimeToolDeclarations: 'supported',
  images: 'unsupported',
  contextTokens: 4096,
};
const unavailableModel = (reason?: string) =>
  JSON.stringify({
    status: 'unavailable',
    capabilities,
    ...(reason === undefined ? {} : { reason }),
  });

beforeEach(() => {
  nativeModule.getAvailabilityAsync.mockReset();
  nativeModule.createSessionAsync.mockReset();
});

it('keeps the provider reason when a requirement is also unsupported', async () => {
  nativeModule.getAvailabilityAsync.mockResolvedValue(unavailableModel('unsupported-os-version'));
  await expect(getAvailabilityAsync({ requires: ['images'] })).resolves.toEqual({
    status: 'unavailable',
    reason: 'unsupported-os-version',
  });
});

it('keeps the provider reason when capabilities are absent and a requirement is unmet', async () => {
  nativeModule.getAvailabilityAsync.mockResolvedValue(
    JSON.stringify({ status: 'unavailable', reason: 'model-unavailable' })
  );
  await expect(getAvailabilityAsync({ requires: ['images'] })).resolves.toEqual({
    status: 'unavailable',
    reason: 'model-unavailable',
  });
});

it('falls back to an unknown reason when the provider sends a non-string one', async () => {
  nativeModule.getAvailabilityAsync.mockResolvedValue(
    JSON.stringify({ status: 'unavailable', capabilities, reason: 7 })
  );
  await expect(getAvailabilityAsync({ requires: ['images'] })).resolves.toEqual({
    status: 'unavailable',
    reason: 'unknown',
  });
});

it.each([
  [
    'module-unavailable',
    'The expo-ai native module is missing from this app. Create a new development build after installing the package.',
  ],
  [
    'unsupported-os-version',
    'This operating system is older than the on-device model requires. Update the device or test on a supported OS version.',
  ],
  [
    'model-unavailable',
    'The device provides no on-device model, or its system configuration is not ready.',
  ],
  [
    'unsupported-feature',
    'The device model does not support a capability this request requires. Remove that capability from the requires list if your app can work without it.',
  ],
  ['language-support-unknown', 'The provider cannot confirm support for the requested languages.'],
  [
    'browser-api-unavailable',
    'This browser does not expose the Prompt API. Use a browser that supports it.',
  ],
  ['browser-model-unavailable', 'This browser exposes the Prompt API but has no model available.'],
  ['unknown', 'The provider did not report a recognised cause.'],
  ['apple-intelligence-siesta', 'The provider did not report a recognised cause.'],
  // Reasons come from the provider as free-form strings, so they can collide with
  // inherited object members.
  ['constructor', 'The provider did not report a recognised cause.'],
  ['toString', 'The provider did not report a recognised cause.'],
  ['hasOwnProperty', 'The provider did not report a recognised cause.'],
  ['__proto__', 'The provider did not report a recognised cause.'],
])('explains the %s reason and keeps the code as a diagnostic', async (reason, explanation) => {
  nativeModule.getAvailabilityAsync.mockResolvedValue(unavailableModel(reason));
  await expect(createSessionAsync()).rejects.toMatchObject({
    code: 'ERR_MODEL_UNAVAILABLE',
    message: `The requested system language model is unavailable. ${explanation} (reason: ${reason}).`,
  });
});

it('explains a missing provider reason with the fallback cause', async () => {
  nativeModule.getAvailabilityAsync.mockResolvedValue(unavailableModel());
  await expect(createSessionAsync()).rejects.toMatchObject({
    code: 'ERR_MODEL_UNAVAILABLE',
    message:
      'The requested system language model is unavailable. The provider did not report a recognised cause. (reason: unknown).',
  });
});
