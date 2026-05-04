import prompts from 'prompts';

import { applySdkVersionToTemplateAsync, fetchSdkVersionsAsync } from '../promptSdkVersion';

jest.mock('prompts');
const mockPrompts = prompts as unknown as jest.Mock;

const fetchMock = jest.fn();
beforeAll(() => {
  // @ts-expect-error - polyfill global fetch for tests
  global.fetch = fetchMock;
});

beforeEach(() => {
  fetchMock.mockReset();
  mockPrompts.mockReset();
  delete process.env.CI;
  delete process.env.EXPO_BETA;
});

const sampleSdkVersions = {
  '40.0.0': { releaseNoteUrl: 'https://example.com/sdk-40', isDeprecated: true },
  '52.0.0': { releaseNoteUrl: 'https://example.com/sdk-52' },
  '53.0.0': { releaseNoteUrl: 'https://example.com/sdk-53' },
  '54.0.0': { releaseNoteUrl: 'https://example.com/sdk-54' },
  '55.0.0': { releaseNoteUrl: 'https://example.com/sdk-55' },
  // No releaseNoteUrl yet — still in development.
  '56.0.0': {},
};

function mockVersionsResponse({
  expoGoSdkVersion,
  sdkVersions = sampleSdkVersions,
}: {
  expoGoSdkVersion?: string;
  sdkVersions?: Record<string, { releaseNoteUrl?: string; isDeprecated?: boolean }>;
} = {}) {
  fetchMock.mockResolvedValue({
    ok: true,
    json: async () => ({ expoGoSdkVersion, sdkVersions }),
  });
}

describe(fetchSdkVersionsAsync, () => {
  it('returns null when the endpoint is unreachable', async () => {
    fetchMock.mockRejectedValue(new Error('network down'));
    expect(await fetchSdkVersionsAsync()).toBeNull();
  });

  it('returns null on a non-ok response', async () => {
    fetchMock.mockResolvedValue({ ok: false, status: 500, json: async () => ({}) });
    expect(await fetchSdkVersionsAsync()).toBeNull();
  });

  it('uses entries with a releaseNoteUrl as released SDKs', async () => {
    mockVersionsResponse({ expoGoSdkVersion: '54.0.0' });
    expect(await fetchSdkVersionsAsync()).toEqual({
      latest: 55,
      expoGoCompatible: 54,
      available: [55, 54, 53, 52],
    });
  });

  it('skips deprecated entries even if they have a releaseNoteUrl', async () => {
    mockVersionsResponse({
      sdkVersions: {
        '53.0.0': { releaseNoteUrl: 'https://example.com', isDeprecated: true },
        '54.0.0': { releaseNoteUrl: 'https://example.com' },
      },
      expoGoSdkVersion: '54.0.0',
    });
    expect(await fetchSdkVersionsAsync()).toEqual({
      latest: 54,
      expoGoCompatible: 54,
      available: [54],
    });
  });

  it('returns null expoGoCompatible when the field is missing', async () => {
    mockVersionsResponse({});
    expect(await fetchSdkVersionsAsync()).toEqual({
      latest: 55,
      expoGoCompatible: null,
      available: [55, 54, 53, 52],
    });
  });

  it('returns null when no entries have a releaseNoteUrl', async () => {
    mockVersionsResponse({ sdkVersions: { '56.0.0': {} } });
    expect(await fetchSdkVersionsAsync()).toBeNull();
  });
});

describe(applySdkVersionToTemplateAsync, () => {
  // Force TTY for the interactive tests below; non-interactive cases override.
  let originalIsTTY: boolean | undefined;
  beforeEach(() => {
    originalIsTTY = process.stdin.isTTY;
    Object.defineProperty(process.stdin, 'isTTY', { value: true, configurable: true });
  });
  afterEach(() => {
    Object.defineProperty(process.stdin, 'isTTY', { value: originalIsTTY, configurable: true });
  });

  it('pins to the latest SDK without prompting when --yes is set with the default template', async () => {
    mockVersionsResponse({ expoGoSdkVersion: '54.0.0' });
    expect(await applySdkVersionToTemplateAsync('expo-template-default', { yes: true })).toBe(
      'expo-template-default@sdk-55'
    );
    expect(mockPrompts).not.toHaveBeenCalled();
  });

  it('pins to the latest SDK without prompting in CI with the default template', async () => {
    process.env.CI = 'true';
    mockVersionsResponse({ expoGoSdkVersion: '54.0.0' });
    expect(await applySdkVersionToTemplateAsync('expo-template-default', { yes: false })).toBe(
      'expo-template-default@sdk-55'
    );
    expect(mockPrompts).not.toHaveBeenCalled();
  });

  it('pins to the latest SDK without prompting when stdin is not a TTY with the default template', async () => {
    Object.defineProperty(process.stdin, 'isTTY', { value: false, configurable: true });
    mockVersionsResponse({ expoGoSdkVersion: '54.0.0' });
    expect(await applySdkVersionToTemplateAsync('expo-template-default', { yes: false })).toBe(
      'expo-template-default@sdk-55'
    );
    expect(mockPrompts).not.toHaveBeenCalled();
  });

  it('passes through to npm `latest` non-interactively when --template is specified', async () => {
    process.env.CI = 'true';
    expect(
      await applySdkVersionToTemplateAsync('expo-template-tabs', {
        yes: false,
        showAlternatives: false,
      })
    ).toBe('expo-template-tabs');
    expect(mockPrompts).not.toHaveBeenCalled();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('skips the prompt when the template already has a tag', async () => {
    expect(
      await applySdkVersionToTemplateAsync('expo-template-default@sdk-54', { yes: false })
    ).toBe('expo-template-default@sdk-54');
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('skips the prompt for unknown templates', async () => {
    expect(await applySdkVersionToTemplateAsync('some-third-party-template', { yes: false })).toBe(
      'some-third-party-template'
    );
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('passes through unchanged when the versions endpoint fails interactively', async () => {
    fetchMock.mockRejectedValue(new Error('network down'));
    expect(await applySdkVersionToTemplateAsync('expo-template-default', { yes: false })).toBe(
      'expo-template-default'
    );
    expect(mockPrompts).not.toHaveBeenCalled();
  });

  it('appends the chosen SDK tag for the latest option', async () => {
    mockVersionsResponse({ expoGoSdkVersion: '54.0.0' });
    mockPrompts.mockResolvedValueOnce({ answer: 55 });
    expect(await applySdkVersionToTemplateAsync('expo-template-default', { yes: false })).toBe(
      'expo-template-default@sdk-55'
    );
  });

  it('prints a "Creating …" line and a Tip stanza after the SDK is picked', async () => {
    const logSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
    mockVersionsResponse({ expoGoSdkVersion: '54.0.0' });
    mockPrompts.mockResolvedValueOnce({ answer: 55 });
    await applySdkVersionToTemplateAsync('expo-template-default', { yes: false });
    const output = logSpy.mock.calls.map((c) => String(c[0] ?? '')).join('\n');
    expect(output).toMatch(/Creating a project using the .*default.* template\./);
    expect(output).toMatch(/Tip:/);
    expect(output).toMatch(/--template/);
    expect(output).toMatch(/--example/);
    logSpy.mockRestore();
  });

  it('uses the project name in the lead-in when provided', async () => {
    const logSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
    mockVersionsResponse({ expoGoSdkVersion: '54.0.0' });
    mockPrompts.mockResolvedValueOnce({ answer: 55 });
    await applySdkVersionToTemplateAsync('expo-template-default', {
      yes: false,
      projectName: 'my-app',
    });
    const output = logSpy.mock.calls.map((c) => String(c[0] ?? '')).join('\n');
    expect(output).toMatch(/Creating .*my-app.* using the .*default.* template/);
    logSpy.mockRestore();
  });

  it('hides the alternatives stanza when showAlternatives is false', async () => {
    const logSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
    mockVersionsResponse({ expoGoSdkVersion: '54.0.0' });
    mockPrompts.mockResolvedValueOnce({ answer: 55 });
    await applySdkVersionToTemplateAsync('expo-template-tabs', {
      yes: false,
      showAlternatives: false,
    });
    const output = logSpy.mock.calls.map((c) => String(c[0] ?? '')).join('\n');
    expect(output).toMatch(/Creating a project using the .*tabs.* template\./);
    expect(output).not.toMatch(/Tip:/);
    expect(output).not.toMatch(/--template/);
    expect(output).not.toMatch(/--example/);
    logSpy.mockRestore();
  });

  it('shows the "For learning with Expo Go" choice with the SDK number in the description', async () => {
    mockVersionsResponse({ expoGoSdkVersion: '54.0.0' });
    mockPrompts.mockResolvedValueOnce({ answer: 54 });
    await applySdkVersionToTemplateAsync('expo-template-default', { yes: false });
    const promptCall = mockPrompts.mock.calls[0][0];
    expect(promptCall.choices).toEqual([
      { title: 'Latest (SDK 55)', value: 55, description: 'Recommended for most projects' },
      {
        title: 'For learning with Expo Go (SDK 54)',
        value: 54,
        description: 'Compatible with Expo Go on App Store and Play Store',
      },
      { title: 'Other SDK version…', value: 'other' },
    ]);
  });

  it('omits the "For learning with Expo Go" choice when expoGoSdkVersion is missing', async () => {
    mockVersionsResponse({});
    mockPrompts.mockResolvedValueOnce({ answer: 55 });
    await applySdkVersionToTemplateAsync('expo-template-default', { yes: false });
    const promptCall = mockPrompts.mock.calls[0][0];
    expect(promptCall.choices).toEqual([
      { title: 'Latest (SDK 55)', value: 55, description: 'Recommended for most projects' },
      { title: 'Other SDK version…', value: 'other' },
    ]);
  });

  it('omits the "For learning with Expo Go" choice when the compatible SDK matches latest', async () => {
    mockVersionsResponse({
      sdkVersions: { '54.0.0': { releaseNoteUrl: 'https://example.com' } },
      expoGoSdkVersion: '54.0.0',
    });
    mockPrompts.mockResolvedValueOnce({ answer: 54 });
    await applySdkVersionToTemplateAsync('expo-template-default', { yes: false });
    const promptCall = mockPrompts.mock.calls[0][0];
    expect(promptCall.choices).toEqual([
      { title: 'Latest (SDK 54)', value: 54, description: 'Recommended for most projects' },
      { title: 'Other SDK version…', value: 'other' },
    ]);
  });

  it('handles the "Other SDK version" submenu', async () => {
    mockVersionsResponse({ expoGoSdkVersion: '54.0.0' });
    mockPrompts.mockResolvedValueOnce({ answer: 'other' }).mockResolvedValueOnce({ sdkAnswer: 53 });
    expect(await applySdkVersionToTemplateAsync('expo-template-default', { yes: false })).toBe(
      'expo-template-default@sdk-53'
    );
    expect(mockPrompts).toHaveBeenCalledTimes(2);
    const submenuCall = mockPrompts.mock.calls[1][0];
    expect(submenuCall.choices).toEqual([
      { title: 'SDK 55', value: 55 },
      { title: 'SDK 54', value: 54 },
      { title: 'SDK 53', value: 53 },
      { title: 'SDK 52', value: 52 },
    ]);
  });
});
