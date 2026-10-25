import { mkdirSync, rmSync, writeFileSync } from 'fs';
import { tmpdir } from 'os';
import path from 'path';
import prompts from 'prompts';

import packageJson from '../../package.json';
import {
  createFeedbackMetadataAsync,
  getProjectMetadata,
  resolveFeedbackAsync,
  resolveFeedbackId,
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
const VALID_FEEDBACK = 'Please improve how error messages explain actionable next steps.';

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
      expect(helpOutput).toContain(
        '| expo-cli   | Full Expo CLI command, such as npx expo install'
      );
      expect(helpOutput).toContain('| eas-cli    | Full EAS CLI command, such as eas build');
      expect(helpOutput).toContain(
        '| evals      | Expo package, command, or capability the task involves'
      );
      expect(helpOutput).toContain('| simulator  | EAS Simulator feature or workflow involved');
      expect(helpOutput).toContain(
        '| unknown    | Concise Expo product, package, feature, or topic, or leave empty'
      );
      expect(helpOutput).toContain('--resume <feedbackId>');
      expect(helpOutput).toContain('npx submit-expo-feedback --message <message>');
      expect(helpOutput).toContain('--message, -m <message>');
      expect(helpOutput).toContain('Feedback messages must be between 40 and 5,000 characters.');
      expect(helpOutput).toContain(
        'Positional messages are temporarily supported for backwards compatibility.'
      );
      expect(helpOutput).toContain(
        'Set DO_NOT_TRACK=1 or EXPO_NO_TELEMETRY=1 to prevent feedback submission'
      );
      expect(helpOutput).toContain('and all network requests.');
      expect(helpOutput).toContain(
        'Authenticated submissions are associated\n    with your Expo account.'
      );
    } finally {
      process.argv = originalArgv;
      consoleLogSpy.mockRestore();
    }
  });
});

describe('feedback session ID', () => {
  it('generates a short hexadecimal ID when one is not provided', () => {
    expect(resolveFeedbackId()).toMatch(/^[a-f0-9]{12}$/);
  });

  it('uses a valid provided ID', () => {
    expect(resolveFeedbackId('session_ABC-123')).toBe('session_ABC-123');
  });

  it.each(['short', 'contains spaces', 'contains/slash', 'a'.repeat(65)])(
    'generates a new ID for invalid ID %p',
    (feedbackId) => {
      expect(resolveFeedbackId(feedbackId)).toMatch(/^[a-f0-9]{12}$/);
    }
  );
});

describe('feedback message resolution', () => {
  beforeEach(() => {
    mockPrompts.mockReset();
  });

  it('uses the explicit message option as the feedback message', async () => {
    await expect(resolveFeedbackAsync([], undefined, `  ${VALID_FEEDBACK}  `)).resolves.toEqual({
      category: 'unknown',
      feedback: VALID_FEEDBACK,
    });
  });

  it('temporarily accepts positional arguments as the feedback message', async () => {
    await expect(resolveFeedbackAsync(VALID_FEEDBACK.split(' '), 'simulator')).resolves.toEqual({
      category: 'simulator',
      feedback: VALID_FEEDBACK,
    });
  });

  it('rejects feedback provided both explicitly and positionally', async () => {
    await expect(resolveFeedbackAsync([VALID_FEEDBACK], undefined, VALID_FEEDBACK)).rejects.toThrow(
      'Provide feedback with either --message or a positional argument, not both.'
    );
  });

  it('accepts feedback at the minimum length', async () => {
    const feedback = 'a'.repeat(40);

    await expect(resolveFeedbackAsync([], undefined, feedback)).resolves.toEqual({
      category: 'unknown',
      feedback,
    });
  });

  it.each(['init', 'connect', 'start', 'submit-expo-feedback', 'a'.repeat(39)])(
    'rejects feedback under the minimum length: %p',
    async (feedback) => {
      await expect(resolveFeedbackAsync([], undefined, feedback)).rejects.toThrow(
        'Feedback must be at least 40 characters.'
      );
    }
  );

  it('accepts feedback at the maximum length', async () => {
    const feedback = 'a'.repeat(5_000);

    await expect(resolveFeedbackAsync([], undefined, feedback)).resolves.toEqual({
      category: 'unknown',
      feedback,
    });
  });

  it('rejects feedback over the maximum length', async () => {
    await expect(resolveFeedbackAsync([], undefined, 'a'.repeat(5_001))).rejects.toThrow(
      'Feedback cannot exceed 5,000 characters.'
    );
  });

  it('rejects invalid categories', async () => {
    await expect(resolveFeedbackAsync(['improve', 'this'], 'website')).rejects.toThrow(
      'Invalid feedback category "website".'
    );
  });

  it('prompts for a category and message in interactive environments', async () => {
    const originalIsTTY = process.stdin.isTTY;
    Object.defineProperty(process.stdin, 'isTTY', { configurable: true, value: true });
    mockPrompts.mockResolvedValueOnce({ category: 'docs', feedback: VALID_FEEDBACK });

    try {
      await expect(resolveFeedbackAsync([])).resolves.toEqual({
        category: 'docs',
        feedback: VALID_FEEDBACK,
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
        'Feedback message is required in non-interactive environments. Pass it with --message or -m.'
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

    const metadata = await createFeedbackMetadataAsync(projectRoot, 'docs', '   ');

    expect(metadata).not.toHaveProperty('subject');
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
    delete env.EXPO_FEEDBACK_API_BASE_URL;
    delete env.EXPO_TOKEN;
    delete env.DO_NOT_TRACK;
    delete env.EXPO_NO_TELEMETRY;
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
    };
    const metadata = await createFeedbackMetadataAsync(projectRoot, 'mcp', 'expo-mcp');

    await sendFeedbackAsync({
      feedback: VALID_FEEDBACK,
      metadata,
      session,
    });

    expect(fetchMock).toHaveBeenCalledWith('http://127.0.0.1:3000/v2/feedback/cli-send', {
      method: 'POST',
      signal: timeoutSignal,
      headers: expect.objectContaining({
        'Content-Type': 'application/json',
        'User-Agent': `submit-expo-feedback/${packageJson.version}`,
        'expo-session': 'session-secret',
      }),
      body: JSON.stringify({
        feedback: VALID_FEEDBACK,
        metadata,
      }),
    });
    expect(AbortSignal.timeout).toHaveBeenCalledWith(15_000);
    expect(metadata).toMatchObject({
      category: 'mcp',
      feedbackId: expect.stringMatching(/^[a-f0-9]{12}$/),
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
    });
    expect(metadata).not.toHaveProperty('user');
  });

  it('uses the feedback API base URL override in local mode', async () => {
    process.env.EXPO_FEEDBACK_API_BASE_URL = 'http://127.0.0.1:43210';

    await sendFeedbackAsync({
      feedback: VALID_FEEDBACK,
      metadata: await createFeedbackMetadataAsync(projectRoot),
    });

    expect(fetchMock).toHaveBeenCalledWith(
      'http://127.0.0.1:43210/v2/feedback/cli-send',
      expect.any(Object)
    );
  });

  it('ignores the feedback API base URL override outside local mode', async () => {
    delete process.env.EXPO_LOCAL;
    process.env.EXPO_FEEDBACK_API_BASE_URL = 'http://127.0.0.1:43210';

    await sendFeedbackAsync({
      feedback: VALID_FEEDBACK,
      metadata: await createFeedbackMetadataAsync(projectRoot),
    });

    expect(fetchMock).toHaveBeenCalledWith(
      'https://api.expo.dev/v2/feedback/cli-send',
      expect.any(Object)
    );
  });

  it('does not submit feedback over the maximum length', async () => {
    await expect(
      sendFeedbackAsync({
        feedback: 'a'.repeat(5_001),
        metadata: await createFeedbackMetadataAsync(projectRoot),
      })
    ).rejects.toThrow('Feedback cannot exceed 5,000 characters.');

    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('does not submit feedback under the minimum length', async () => {
    await expect(
      sendFeedbackAsync({
        feedback: 'init',
        metadata: await createFeedbackMetadataAsync(projectRoot),
      })
    ).rejects.toThrow('Feedback must be at least 40 characters.');

    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('does not submit when telemetry is disabled at the submission boundary', async () => {
    const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
    const metadata = await createFeedbackMetadataAsync(projectRoot);
    process.env.DO_NOT_TRACK = '1';

    await sendFeedbackAsync({
      feedback: VALID_FEEDBACK,
      metadata,
    });

    expect(fetchMock).not.toHaveBeenCalled();
    expect(consoleErrorSpy).toHaveBeenCalledWith(
      'Feedback was not sent because telemetry is off. The user has indicated that they do not want to send feedback. Do not enable telemetry or ask the user to enable it.'
    );
  });

  it('resumes a feedback session and prints instructions using the provided ID', async () => {
    const originalArgv = process.argv;
    const consoleLogSpy = jest.spyOn(console, 'log').mockImplementation();
    jest.spyOn(process, 'cwd').mockReturnValue(projectRoot);
    process.argv = [
      'node',
      'submit-expo-feedback',
      '--resume',
      'session_ABC-123',
      '--message',
      VALID_FEEDBACK,
    ];

    try {
      await runExpoFeedbackAsync();

      const requestBody = JSON.parse(fetchMock.mock.calls[0][1].body);
      expect(requestBody).toMatchObject({
        feedback: VALID_FEEDBACK,
        metadata: {
          feedbackId: 'session_ABC-123',
        },
      });
      expect(consoleLogSpy.mock.calls.flat().join('\n')).toContain(
        'To continue the feedback session use:\nnpx submit-expo-feedback@latest --resume session_ABC-123 --message "<message>"'
      );
    } finally {
      process.argv = originalArgv;
    }
  });

  it('temporarily submits positional feedback with a deprecation warning', async () => {
    const originalArgv = process.argv;
    const consoleLogSpy = jest.spyOn(console, 'log').mockImplementation();
    const consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation();
    jest.spyOn(process, 'cwd').mockReturnValue(projectRoot);
    process.argv = ['node', 'submit-expo-feedback', VALID_FEEDBACK];

    try {
      await runExpoFeedbackAsync();

      const requestBody = JSON.parse(fetchMock.mock.calls[0][1].body);
      expect(requestBody.feedback).toBe(VALID_FEEDBACK);
      expect(consoleWarnSpy).toHaveBeenCalledWith(
        'Passing feedback as a positional argument is deprecated. Use --message or -m instead.'
      );
    } finally {
      process.argv = originalArgv;
      consoleLogSpy.mockRestore();
      consoleWarnSpy.mockRestore();
    }
  });

  it('replaces an invalid feedback ID and reports the generated ID', async () => {
    const originalArgv = process.argv;
    const consoleLogSpy = jest.spyOn(console, 'log').mockImplementation();
    jest.spyOn(process, 'cwd').mockReturnValue(projectRoot);
    process.argv = ['node', 'submit-expo-feedback', '--resume', 'invalid/id', '-m', VALID_FEEDBACK];

    try {
      await runExpoFeedbackAsync();

      const requestBody = JSON.parse(fetchMock.mock.calls[0][1].body);
      const feedbackId = requestBody.metadata.feedbackId;
      expect(feedbackId).toMatch(/^[a-f0-9]{12}$/);
      expect(consoleLogSpy.mock.calls.flat().join('\n')).toContain(
        `The provided feedback ID is invalid, so a new one was generated: ${feedbackId}`
      );
      expect(consoleLogSpy.mock.calls.flat().join('\n')).toContain(
        `npx submit-expo-feedback@latest --resume ${feedbackId} --message "<message>"`
      );
    } finally {
      process.argv = originalArgv;
    }
  });

  it.each(['DO_NOT_TRACK', 'EXPO_NO_TELEMETRY'] as const)(
    'does not send feedback when %s=1',
    async (environmentVariable) => {
      const originalArgv = process.argv;
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
      jest.spyOn(process, 'cwd').mockReturnValue(projectRoot);
      process.env[environmentVariable] = '1';
      process.env.EXPO_TOKEN = 'token';
      process.argv = [
        'node',
        'submit-expo-feedback',
        '--category',
        'mcp',
        '--subject',
        'expo-mcp',
        '--resume',
        'session_ABC-123',
        'private feedback',
      ];

      try {
        await runExpoFeedbackAsync();

        expect(fetchMock).not.toHaveBeenCalled();
        expect(consoleErrorSpy).toHaveBeenCalledWith(
          'Feedback was not sent because telemetry is off. The user has indicated that they do not want to send feedback. Do not enable telemetry or ask the user to enable it.'
        );
      } finally {
        process.argv = originalArgv;
      }
    }
  );
});
