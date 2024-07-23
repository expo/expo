import { getConfig } from '@expo/config';
import { Updates } from '@expo/config-plugins';

import { createFingerprintAsync } from '../createFingerprintAsync';
import { resolveRuntimeVersionAsync } from '../resolveRuntimeVersionAsync';
import { resolveWorkflowAsync } from '../workflow';

jest.mock('@expo/config-plugins', () => ({
  Updates: {
    resolveRuntimeVersionPolicyAsync: jest.fn(),
  },
}));
jest.mock('@expo/config');

jest.mock('../workflow');
jest.mock('../createFingerprintAsync');

describe(resolveRuntimeVersionAsync, () => {
  it('succeeds for constant string', async () => {
    jest.mocked(getConfig).mockReturnValue({
      exp: { name: 'test', slug: 'test', runtimeVersion: '3' },
    } as any);
    jest.mocked(resolveWorkflowAsync).mockResolvedValue('managed');
    await expect(resolveRuntimeVersionAsync('.', 'ios', {}, {})).resolves.toEqual({
      runtimeVersion: '3',
      fingerprintSources: null,
      workflow: 'managed',
    });
  });

  it('uses platform precedence for constant string', async () => {
    jest.mocked(getConfig).mockReturnValue({
      exp: { name: 'test', slug: 'test', runtimeVersion: '3', ios: { runtimeVersion: '4' } },
    } as any);
    jest.mocked(resolveWorkflowAsync).mockResolvedValue('managed');
    await expect(resolveRuntimeVersionAsync('.', 'ios', {}, {})).resolves.toEqual({
      runtimeVersion: '4',
      fingerprintSources: null,
      workflow: 'managed',
    });
  });

  it('throws for bare when not fingerprint policy or constant string', async () => {
    jest.mocked(getConfig).mockReturnValue({
      exp: { name: 'test', slug: 'test', runtimeVersion: { policy: 'nativeVersion' } },
    } as any);
    jest.mocked(resolveWorkflowAsync).mockResolvedValue('generic');

    await expect(resolveRuntimeVersionAsync('.', 'ios', {}, {})).rejects.toThrow(
      `You're currently using the bare workflow, where runtime version policies are not supported. You must set your runtime version manually. For example, define your runtime version as "1.0.0", not {"policy": "appVersion"} in your app config. https://docs.expo.dev/eas-update/runtime-versions`
    );
  });

  it('supports workflow override', async () => {
    jest.mocked(getConfig).mockReturnValue({
      exp: { name: 'test', slug: 'test', runtimeVersion: { policy: 'nativeVersion' } },
    } as any);
    jest.mocked(resolveWorkflowAsync).mockResolvedValue('generic');

    await expect(
      resolveRuntimeVersionAsync('.', 'ios', {}, { workflowOverride: 'managed' })
    ).resolves.not.toThrow();
  });

  it('returns a fingerprint when fingerprint policy', async () => {
    jest.mocked(getConfig).mockReturnValue({
      exp: { name: 'test', slug: 'test', runtimeVersion: { policy: 'fingerprint' } },
    } as any);
    jest.mocked(resolveWorkflowAsync).mockResolvedValue('managed');
    jest.mocked(createFingerprintAsync).mockResolvedValue({ hash: 'hello', sources: [] });

    await expect(resolveRuntimeVersionAsync('.', 'ios', {}, {})).resolves.toEqual({
      runtimeVersion: 'hello',
      fingerprintSources: [],
      workflow: 'managed',
    });
  });

  it('returns the config plugins evaluated when other policy', async () => {
    jest.mocked(getConfig).mockReturnValue({
      exp: { name: 'test', slug: 'test', runtimeVersion: { policy: 'appVersion' } },
    } as any);

    jest.mocked(resolveWorkflowAsync).mockResolvedValue('managed');
    jest.mocked(Updates.resolveRuntimeVersionPolicyAsync).mockResolvedValue('what');

    await expect(resolveRuntimeVersionAsync('.', 'ios', {}, {})).resolves.toEqual({
      runtimeVersion: 'what',
      fingerprintSources: null,
      workflow: 'managed',
    });
  });
});
