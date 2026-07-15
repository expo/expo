import { mkdirSync, rmSync, writeFileSync } from 'fs';
import { tmpdir } from 'os';
import path from 'path';

import {
  createFeedbackMetadataAsync,
  getProjectMetadata,
  getUserMetadataAsync,
  resolveFeedbackAsync,
  runExpoFeedbackAsync,
  sendFeedbackAsync,
} from '../cli';

jest.mock('agent-cli-detector', () => ({
  detectAgent: jest.fn(() => ({
    detected: true,
    agent: {
      id: 'codex',
      name: 'Codex',
      sessionId: 'test-session',
    },
  })),
}));

function createTempDir(): string {
  return mkdtemp(path.join(tmpdir(), 'submit-expo-feedback-test-'));
}

function mkdtemp(prefix: string): string {
  const { mkdtempSync } = jest.requireActual<typeof import('fs')>('fs');
  return mkdtempSync(prefix);
}

function writeJson(filePath: string, value: unknown): void {
  mkdirSync(path.dirname(filePath), { recursive: true });
  writeFileSync(filePath, JSON.stringify(value, null, 2));
}

describe('feedback message resolution', () => {
  it('uses positional arguments as the feedback message', async () => {
    await expect(resolveFeedbackAsync(['please', 'improve', 'errors'])).resolves.toBe(
      'please improve errors'
    );
  });
});

describe('Node.js version validation', () => {
  it('stops before running the command on unsupported Node.js versions', async () => {
    const versionDescriptor = Object.getOwnPropertyDescriptor(process, 'version')!;
    Object.defineProperty(process, 'version', { ...versionDescriptor, value: 'v22.12.0' });

    try {
      await expect(runExpoFeedbackAsync()).rejects.toThrow(
        'Node.js (v22.12.0) is outdated and unsupported.'
      );
    } finally {
      Object.defineProperty(process, 'version', versionDescriptor);
    }
  });
});

describe('project metadata', () => {
  let projectRoot: string;

  afterEach(() => {
    rmSync(projectRoot, { force: true, recursive: true });
  });

  it('does not treat a generic package.json as an Expo project', () => {
    projectRoot = createTempDir();
    writeJson(path.join(projectRoot, 'package.json'), {
      name: 'not-an-expo-app',
      version: '1.0.0',
    });

    expect(getProjectMetadata(projectRoot)).toEqual({
      isExpoProject: false,
    });
  });

  it('reads Expo config and installed package versions from an Expo project', () => {
    projectRoot = createTempDir();
    writeJson(path.join(projectRoot, 'package.json'), {
      name: 'friend-draw',
      version: '1.0.0',
      dependencies: {
        expo: '^56.0.4',
        'react-native': '0.85.3',
      },
    });
    writeJson(path.join(projectRoot, 'app.json'), {
      expo: {
        name: 'Friend Draw',
        slug: 'friend-draw',
        platforms: ['ios', 'android'],
      },
    });
    writeJson(path.join(projectRoot, 'node_modules/expo/package.json'), {
      name: 'expo',
      version: '56.0.12',
    });
    writeJson(path.join(projectRoot, 'node_modules/react-native/package.json'), {
      name: 'react-native',
      version: '0.85.3',
    });

    expect(getProjectMetadata(projectRoot)).toMatchObject({
      isExpoProject: true,
      name: 'Friend Draw',
      slug: 'friend-draw',
      sdkVersion: '56.0.0',
      platforms: ['ios', 'android'],
      expoPackageVersion: '56.0.12',
      reactNativePackageVersion: '0.85.3',
    });
  });
});

describe('user metadata', () => {
  it('includes username and id from the local session state', async () => {
    await expect(
      getUserMetadataAsync({
        sessionSecret: 'secret',
        userId: 'user-id',
        username: 'expo-user',
      })
    ).resolves.toEqual({
      authType: 'session',
      id: 'user-id',
      username: 'expo-user',
    });
  });

  it('does not shell out to expo whoami when username is missing', async () => {
    await expect(
      getUserMetadataAsync({
        sessionSecret: 'secret',
        userId: 'user-id',
      })
    ).resolves.toEqual({
      authType: 'session',
      id: 'user-id',
    });
  });
});

describe('feedback submission', () => {
  const originalEnv = process.env;
  let homeDir: string;
  let projectRoot: string;
  let fetchMock: jest.Mock;

  beforeEach(() => {
    homeDir = createTempDir();
    projectRoot = createTempDir();
    const env: NodeJS.ProcessEnv = {
      ...originalEnv,
      EXPO_LOCAL: '1',
      __UNSAFE_EXPO_HOME_DIRECTORY: homeDir,
    };
    delete env.EXPO_STAGING;
    delete env.EXPO_TOKEN;
    process.env = env;
    writeJson(path.join(homeDir, 'state.json'), {
      auth: {
        sessionSecret: 'session-secret',
        userId: 'user-id',
        username: 'expo-user',
      },
    });
    writeJson(path.join(projectRoot, 'package.json'), {
      name: 'not-an-expo-app',
      version: '1.0.0',
    });
    fetchMock = jest.fn(async () => ({ ok: true }));
    global.fetch = fetchMock as typeof fetch;
  });

  afterEach(() => {
    process.env = originalEnv;
    rmSync(homeDir, { force: true, recursive: true });
    rmSync(projectRoot, { force: true, recursive: true });
    jest.restoreAllMocks();
  });

  it('posts feedback and metadata to the local CLI feedback endpoint', async () => {
    const metadata = await createFeedbackMetadataAsync(projectRoot);

    await sendFeedbackAsync({
      feedback: 'please make errors clearer',
      metadata,
    });

    expect(fetchMock).toHaveBeenCalledWith('http://127.0.0.1:3000/v2/feedback/cli-send', {
      method: 'POST',
      headers: expect.objectContaining({
        'Content-Type': 'application/json',
        'User-Agent': 'submit-expo-feedback/0.0.0',
        'expo-session': 'session-secret',
      }),
      body: JSON.stringify({
        feedback: 'please make errors clearer',
        metadata,
      }),
    });
    expect(metadata).toMatchObject({
      agentEnvironment: {
        detected: true,
        agent: {
          id: 'codex',
          name: 'Codex',
          sessionId: 'test-session',
        },
      },
      project: {
        isExpoProject: false,
      },
      user: {
        authType: 'session',
        id: 'user-id',
        username: 'expo-user',
      },
    });
  });
});
