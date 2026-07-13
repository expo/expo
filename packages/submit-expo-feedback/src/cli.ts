import { getConfig, getConfigFilePaths } from '@expo/config';
import { resolvePackageManager } from '@expo/package-manager';
import { detectAgent } from 'agent-cli-detector';
import arg from 'arg';
import chalk from 'chalk';
import * as ciInfo from 'ci-info';
import { existsSync, readFileSync } from 'fs';
import { homedir } from 'os';
import path from 'path';
import prompts from 'prompts';

const NODE_MIN = [22, 13, 0] as const;
const CLI_NAME = 'submit-expo-feedback';

type UserSession = {
  sessionSecret?: string;
  userId?: string;
  username?: string;
};

type PackageJson = {
  name?: unknown;
  dependencies?: Record<string, unknown>;
  devDependencies?: Record<string, unknown>;
};

type ConfigFilePaths = {
  staticConfigPath: string | null;
  dynamicConfigPath: string | null;
};

type FeedbackMetadata = {
  cli: {
    name: typeof CLI_NAME;
    version: string;
  };
  agentEnvironment: ReturnType<typeof getAgentEnvironment>;
  ci?: {
    name: string | null;
    isPr: boolean | null;
  };
  device: {
    arch: string;
    platform: NodeJS.Platform;
  };
  node: {
    version: string;
  };
  packageManager: string | null;
  project: {
    isExpoProject: boolean;
    name?: string;
    slug?: string;
    sdkVersion?: string;
    platforms?: string[];
    expoPackageVersion?: string;
    reactNativePackageVersion?: string;
    expoRouterPackageVersion?: string;
  };
  user?: {
    id?: string;
    username?: string;
    authType: 'token' | 'session';
  };
};

export async function runExpoFeedbackAsync(): Promise<void> {
  checkNodeVersion();
  await runAsync();
}

export function logErrorAndExit(error: unknown): never {
  if (error instanceof CommandError) {
    console.error(chalk.red(error.message));
  } else {
    console.error(chalk.red(error instanceof Error ? error.message : String(error)));
    if (process.env.EXPO_DEBUG && error instanceof Error && error.stack) {
      console.error(chalk.gray(error.stack));
    }
  }
  process.exit(1);
}

async function runAsync(): Promise<void> {
  const args = arg(
    {
      '--help': Boolean,
      '--version': Boolean,
      '-h': '--help',
      '-v': '--version',
    },
    {
      argv: process.argv.slice(2),
      permissive: true,
    }
  );

  if (args['--help']) {
    printHelp();
    return;
  }

  if (args['--version']) {
    console.log(getPackageVersion());
    return;
  }

  const feedback = await resolveFeedbackAsync(args._);
  const session = getSession();
  const metadata = await createFeedbackMetadataAsync(process.cwd(), session);

  await sendFeedbackAsync({
    feedback,
    metadata,
    session,
  });

  console.log(chalk.green('Thanks for the feedback!'));
}

export async function resolveFeedbackAsync(messageParts: string[]): Promise<string> {
  const feedback = messageParts.join(' ').trim();
  if (feedback) {
    return feedback;
  }

  const response = await prompts(
    {
      type: 'text',
      name: 'feedback',
      message: 'Share feedback with Expo',
      validate: (value) => (value.trim() ? true : 'Feedback cannot be empty.'),
    },
    {
      onCancel() {
        throw new CommandError('Feedback prompt was cancelled.');
      },
    }
  );

  const promptedFeedback = response.feedback?.trim();
  if (!promptedFeedback) {
    throw new CommandError('Feedback message cannot be empty.');
  }
  return promptedFeedback;
}

export async function createFeedbackMetadataAsync(
  projectRoot: string,
  session = getSession()
): Promise<FeedbackMetadata> {
  return {
    cli: {
      name: CLI_NAME,
      version: getPackageVersion(),
    },
    agentEnvironment: getAgentEnvironment(),
    ci: ciInfo.isCI
      ? {
          name: ciInfo.name ?? null,
          isPr: ciInfo.isPR ?? null,
        }
      : undefined,
    device: {
      arch: process.arch,
      platform: process.platform,
    },
    node: {
      version: process.versions.node,
    },
    packageManager: resolvePackageManager(projectRoot),
    project: getProjectMetadata(projectRoot),
    user: await getUserMetadataAsync(session),
  };
}

function getAgentEnvironment() {
  const result = detectAgent();

  return {
    detected: result.detected,
    agent: result.agent,
  };
}

export async function getUserMetadataAsync(
  session: UserSession | null
): Promise<FeedbackMetadata['user']> {
  const authType = process.env.EXPO_TOKEN ? 'token' : session?.sessionSecret ? 'session' : null;
  if (!authType) {
    return undefined;
  }

  const username = session?.username;
  if (username) {
    return {
      id: session?.userId,
      username,
      authType,
    };
  }

  return {
    id: session?.userId,
    authType,
  };
}

export function getProjectMetadata(projectRoot: string): FeedbackMetadata['project'] {
  const pkg = getPackageJson(projectRoot);
  const paths = getConfigFilePaths(projectRoot);

  if (!hasExpoProjectConfig(paths, pkg)) {
    return {
      isExpoProject: false,
    };
  }

  try {
    const { exp, pkg: configPkg } = getConfig(projectRoot, {
      skipPlugins: true,
      skipSDKVersionRequirement: true,
    });
    const expoPackageVersion =
      getInstalledPackageVersion(projectRoot, 'expo') ?? getDependencyVersion(configPkg, 'expo');

    return {
      isExpoProject: true,
      name: exp.name,
      slug: exp.slug,
      sdkVersion: exp.sdkVersion,
      platforms: exp.platforms,
      expoPackageVersion,
      reactNativePackageVersion:
        getInstalledPackageVersion(projectRoot, 'react-native') ??
        getDependencyVersion(configPkg, 'react-native'),
      expoRouterPackageVersion:
        getInstalledPackageVersion(projectRoot, 'expo-router') ??
        getDependencyVersion(configPkg, 'expo-router'),
    };
  } catch {
    return {
      isExpoProject: true,
    };
  }
}

function hasExpoProjectConfig(paths: ConfigFilePaths, pkg: PackageJson | null): boolean {
  return (
    !!paths.staticConfigPath ||
    !!paths.dynamicConfigPath ||
    !!(pkg && getDependencyVersion(pkg, 'expo'))
  );
}

function getDependencyVersion(
  pkg: { dependencies?: Record<string, unknown>; devDependencies?: Record<string, unknown> } | null,
  name: string
): string | undefined {
  if (!pkg) {
    return undefined;
  }

  const version = pkg.dependencies?.[name] ?? pkg.devDependencies?.[name];
  return typeof version === 'string' ? version : undefined;
}

function getPackageJson(projectRoot: string): PackageJson | null {
  try {
    return JSON.parse(readFileSync(path.join(projectRoot, 'package.json'), 'utf8')) as PackageJson;
  } catch {
    return null;
  }
}

function getInstalledPackageVersion(projectRoot: string, packageName: string): string | undefined {
  try {
    const packageJsonPath = getResolvedPackageJsonPath(projectRoot, packageName);
    const pkg = JSON.parse(readFileSync(packageJsonPath, 'utf8')) as { version?: unknown };
    return typeof pkg.version === 'string' ? pkg.version : undefined;
  } catch {
    return undefined;
  }
}

function getResolvedPackageJsonPath(projectRoot: string, packageName: string): string {
  let currentPath = projectRoot;
  while (true) {
    const packageJsonPath = path.join(currentPath, 'node_modules', packageName, 'package.json');
    if (existsSync(packageJsonPath)) {
      return packageJsonPath;
    }

    const parentPath = path.dirname(currentPath);
    if (parentPath === currentPath) {
      throw new Error(`Could not resolve ${packageName}/package.json from ${projectRoot}`);
    }
    currentPath = parentPath;
  }
}

export async function sendFeedbackAsync({
  feedback,
  metadata,
  session,
}: {
  feedback: string;
  metadata: FeedbackMetadata;
  session?: UserSession | null;
}): Promise<void> {
  const response = await fetch(new URL('/v2/feedback/cli-send', getExpoApiBaseUrl()).toString(), {
    method: 'POST',
    headers: {
      ...getAuthHeaders(session),
      'Content-Type': 'application/json',
      'User-Agent': `${CLI_NAME}/${getPackageVersion()}`,
    },
    body: JSON.stringify({
      feedback,
      metadata,
    }),
  });

  if (!response.ok) {
    const message = await getErrorMessageAsync(response);
    throw new CommandError(message);
  }
}

export function getAuthHeaders(session = getSession()): Record<string, string> {
  if (process.env.EXPO_TOKEN) {
    return {
      authorization: `Bearer ${process.env.EXPO_TOKEN}`,
    };
  }

  const sessionSecret = session?.sessionSecret;
  if (sessionSecret) {
    return {
      'expo-session': sessionSecret,
    };
  }

  return {};
}

async function getErrorMessageAsync(response: Response): Promise<string> {
  const fallback = `Failed to send feedback (${response.status} ${response.statusText})`;

  try {
    const json: any = await response.json();
    const message = json?.errors?.[0]?.message;
    return typeof message === 'string' ? message : fallback;
  } catch {
    return fallback;
  }
}

function getSession(): UserSession | null {
  const statePath = path.join(getExpoHomeDirectory(), 'state.json');
  if (!existsSync(statePath)) {
    return null;
  }

  try {
    const contents = JSON.parse(readFileSync(statePath, 'utf8')) as {
      auth?: UserSession | null;
    };
    return contents.auth ?? null;
  } catch {
    return null;
  }
}

export function getExpoHomeDirectory(): string {
  if (process.env.__UNSAFE_EXPO_HOME_DIRECTORY) {
    return process.env.__UNSAFE_EXPO_HOME_DIRECTORY;
  } else if (process.env.EXPO_STAGING) {
    return path.join(homedir(), '.expo-staging');
  } else if (process.env.EXPO_LOCAL) {
    return path.join(homedir(), '.expo-local');
  }
  return path.join(homedir(), '.expo');
}

function getExpoApiBaseUrl(): string {
  if (process.env.EXPO_STAGING) {
    return 'https://staging-api.expo.dev';
  } else if (process.env.EXPO_LOCAL) {
    return 'http://127.0.0.1:3000';
  }
  return 'https://api.expo.dev';
}

function checkNodeVersion(): void {
  const nodeVersion = process.version.slice(1).split('.', 3).map(Number);
  if (
    nodeVersion[0]! < NODE_MIN[0] ||
    (nodeVersion[0] === NODE_MIN[0] && nodeVersion[1]! < NODE_MIN[1])
  ) {
    console.error(
      chalk.red`{bold Node.js (${process.version}) is outdated and unsupported.}` +
        chalk.red` Please update to a newer Node.js LTS version (required: >=${NODE_MIN.join('.')})\n` +
        chalk.red`Go to: https://nodejs.org/en/download\n`
    );
  }
}

function printHelp(): void {
  console.log(chalk`
  {bold Usage}
    {dim $} npx submit-expo-feedback {dim <message>}

  {bold Info}
    Send feedback to the Expo team. If no message is provided, you will be prompted.

  {bold Options}
    --version, -v   Version number
    --help, -h      Usage info
`);
}

function getPackageVersion(): string {
  try {
    return require('../package.json').version;
  } catch {
    return '0.0.0';
  }
}

class CommandError extends Error {}
