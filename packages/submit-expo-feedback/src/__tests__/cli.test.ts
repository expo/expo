import { mkdirSync, rmSync, writeFileSync } from 'fs';
import { tmpdir } from 'os';
import path from 'path';
import prompts from 'prompts';

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
jest.mock('sandbox-cli-detector', () => ({
  detectSandbox: jest.fn(() => ({
    detected: true,
    sandbox: {
      id: 'e2b',
      name: 'E2B',
    },
  })),
}));
jest.mock('ci-info', () => ({
  ...jest.requireActual('ci-info'),
  isCI: false,
}));
jest.mock('prompts');

const mockPrompts = prompts as unknown as jest.Mock;

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

describe('help output', () => {
  it('explains the expected subject for each category', async () => {
    const originalArgv = process.argv;
    const consoleLogSpy = jest.spyOn(console, 'log').mockImplementation();
    process.argv = ['node', 'submit-expo-feedback', '--help'];

    try {
      await runExpoFeedbackAsync();

      const helpOutput = consoleLogSpy.mock.calls.flat().join('\n');
      expect(helpOutput).toContain('| Category   | Subject');
      expect(helpOutput).toContain('| skills     | Exact skill name, such as expo-router');
      expect(helpOutput).toContain('| docs       | Full Expo documentation URL');
      expect(helpOutput).toContain('| mcp        | Exact MCP tool name used');
      expect(helpOutput).toContain('| expo-cli   | Full Expo CLI command, such as npx expo install');
      expect(helpOutput).toContain('| eas-cli    | Full EAS CLI command, such as eas build');
      expect(helpOutput).toContain(
        '| unknown    | Concise Expo product, package, feature, or topic, or leave empty'
      );
    } finally {
      process.argv = originalArgv;
      consoleLogSpy.mockRestore();
    }
  });
});

describe('feedback message resolution', () => {
  beforeEach(() => {
    mockPrompts.mockReset();
  });

  it('uses positional arguments as the feedback message', async () => {
    await expect(resolveFeedbackAsync(['please', 'improve', 'errors'])).resolves.toEqual({
      category: 'unknown',
      feedback: 'please improve errors',
    });
  });

  it('uses a category supplied on the command line', async () => {
    await expect(resolveFeedbackAsync(['improve', 'the', 'server'], 'mcp')).resolves.toEqual({
      category: 'mcp',
      feedback: 'improve the server',
    });
  });

  it('rejects invalid categories', async () => {
    await expect(resolveFeedbackAsync(['improve', 'this'], 'website')).rejects.toThrow(
      'Invalid feedback category "website".'
    );
  });

  it('prompts for a category and message in interactive environments', async () => {
    const originalIsTTY = process.stdin.isTTY;
    Object.defineProperty(process.stdin, 'isTTY', { configurable: true, value: true });
    mockPrompts.mockResolvedValueOnce({ category: 'docs', feedback: 'Clarify this example.' });

    try {
      await expect(resolveFeedbackAsync([])).resolves.toEqual({
        category: 'docs',
        feedback: 'Clarify this example.',
      });
      expect(mockPrompts).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({ name: 'category', type: 'select' }),
          expect.objectContaining({ name: 'feedback', type: 'text' }),
        ]),
        expect.any(Object)
      );
    } finally {
      Object.defineProperty(process.stdin, 'isTTY', {
        configurable: true,
        value: originalIsTTY,
      });
    }
  });

  it('requires a message without prompting in non-interactive environments', async () => {
    const originalIsTTY = process.stdin.isTTY;
    Object.defineProperty(process.stdin, 'isTTY', { configurable: true, value: false });

    try {
      await expect(resolveFeedbackAsync([])).rejects.toThrow(
        'Feedback message is required in non-interactive environments.'
      );
      expect(mockPrompts).not.toHaveBeenCalled();
    } finally {
      Object.defineProperty(process.stdin, 'isTTY', {
        configurable: true,
        value: originalIsTTY,
      });
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

  it('includes a trimmed feedback subject when provided', async () => {
    projectRoot = createTempDir();
    writeJson(path.join(projectRoot, 'package.json'), {
      name: 'not-an-expo-app',
      version: '1.0.0',
    });

    await expect(
      createFeedbackMetadataAsync(
        projectRoot,
        null,
        'docs',
        ' https://docs.expo.dev/router/introduction/ '
      )
    ).resolves.toMatchObject({
      category: 'docs',
      subject: 'https://docs.expo.dev/router/introduction/',
    });
  });

  it('omits an empty feedback subject', async () => {
    projectRoot = createTempDir();
    writeJson(path.join(projectRoot, 'package.json'), {
      name: 'not-an-expo-app',
      version: '1.0.0',
    });

    const metadata = await createFeedbackMetadataAsync(projectRoot, null, 'docs', '   ');

    expect(metadata).not.toHaveProperty('subject');
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
  let projectRoot: string;
  let fetchMock: jest.Mock;

  beforeEach(() => {
    projectRoot = createTempDir();
    const env: NodeJS.ProcessEnv = {
      ...originalEnv,
      EXPO_LOCAL: '1',
    };
    delete env.EXPO_STAGING;
    delete env.EXPO_TOKEN;
    process.env = env;
    writeJson(path.join(projectRoot, 'package.json'), {
      name: 'not-an-expo-app',
      version: '1.0.0',
    });
    fetchMock = jest.fn(async () => ({ ok: true }));
    global.fetch = fetchMock as typeof fetch;
  });

  afterEach(() => {
    process.env = originalEnv;
    rmSync(projectRoot, { force: true, recursive: true });
    jest.restoreAllMocks();
  });

  it('posts feedback and metadata to the local CLI feedback endpoint', async () => {
    const timeoutSignal = new AbortController().signal;
    jest.spyOn(AbortSignal, 'timeout').mockReturnValue(timeoutSignal);
    const session = {
      sessionSecret: 'session-secret',
      userId: 'user-id',
      username: 'expo-user',
    };
    const metadata = await createFeedbackMetadataAsync(projectRoot, session, 'mcp', 'expo-mcp');

    await sendFeedbackAsync({
      feedback: 'please make errors clearer',
      metadata,
      session,
    });

    expect(fetchMock).toHaveBeenCalledWith('http://127.0.0.1:3000/v2/feedback/cli-send', {
      method: 'POST',
      signal: timeoutSignal,
      headers: expect.objectContaining({
        'Content-Type': 'application/json',
        'User-Agent': 'submit-expo-feedback/0.0.2',
        'expo-session': 'session-secret',
      }),
      body: JSON.stringify({
        feedback: 'please make errors clearer',
        metadata,
      }),
    });
    expect(AbortSignal.timeout).toHaveBeenCalledWith(15_000);
    expect(metadata).toMatchObject({
      category: 'mcp',
      subject: 'expo-mcp',
      agentEnvironment: {
        detected: true,
        agent: {
          id: 'codex',
          name: 'Codex',
          sessionId: 'test-session',
        },
      },
      sandboxEnvironment: {
        detected: true,
        sandbox: {
          id: 'e2b',
          name: 'E2B',
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
