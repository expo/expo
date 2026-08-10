import { getConfig, getConfigFilePaths } from '@expo/config';
import { resolvePackageManager } from '@expo/package-manager';
import { detectAgent } from 'agent-cli-detector';
import arg from 'arg';
import chalk from 'chalk';
import * as ciInfo from 'ci-info';
import { randomBytes } from 'crypto';
import { existsSync, readFileSync } from 'fs';
import { homedir } from 'os';
import path from 'path';
import prompts from 'prompts';
import { detectSandbox } from 'sandbox-cli-detector';

import {
  CLI_FEEDBACK_CATEGORIES,
  CLI_FEEDBACK_MAX_LENGTH,
  type CliFeedbackCategory,
  type CliFeedbackContextMetadata,
  type CliFeedbackMetadata,
  type CliFeedbackProjectMetadata,
  type CliFeedbackRequest,
  type CliFeedbackTelemetryMetadata,
} from './types';

const CLI_NAME = 'submit-expo-feedback';
const FEEDBACK_TIMEOUT_MS = 15_000;
const GENERATED_FEEDBACK_ID_BYTES = 6;
const MIN_FEEDBACK_ID_LENGTH = 6;
const MAX_FEEDBACK_ID_LENGTH = 64;
const FEEDBACK_ID_PATTERN = /^[A-Za-z0-9_-]+$/;

type UserSession = {
  sessionSecret?: string;
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

export async function runExpoFeedbackAsync(): Promise<void> {
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
      '--category': String,
      '--subject': String,
      '--resume': String,
      '-h': '--help',
      '-v': '--version',
      '-c': '--category',
      '-s': '--subject',
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

  const { category, feedback } = await resolveFeedbackAsync(args._, args['--category']);
  const telemetryDisabled = isTelemetryDisabled();
  const session = telemetryDisabled ? null : getSession();
  const metadata = await createFeedbackMetadataAsync(
    process.cwd(),
    category,
    args['--subject'],
    args['--resume']
  );
  if (args['--resume'] !== undefined && metadata.feedbackId !== args['--resume']) {
    console.log(
      chalk.yellow(
        `The provided feedback ID is invalid, so a new one was generated: ${metadata.feedbackId}`
      )
    );
  }

  console.log(
    chalk.dim(
      telemetryDisabled
        ? 'Submitting feedback without telemetry data because telemetry collection is disabled.'
        : 'Submitting feedback with detected agent, sandbox, environment, and project metadata. Authenticated submissions are associated with your Expo account.'
    )
  );
  await sendFeedbackAsync({
    feedback,
    metadata,
    session,
  });

  console.log(chalk.green('Thanks for the feedback!'));
  console.log(
    `To continue the feedback session use:\nnpx submit-expo-feedback@latest --resume ${metadata.feedbackId}`
  );
}

export async function resolveFeedbackAsync(
  messageParts: string[],
  categoryValue?: string
): Promise<{ category: CliFeedbackCategory; feedback: string }> {
  const category = resolveFeedbackCategory(categoryValue);
  const feedback = messageParts.join(' ').trim();
  if (feedback) {
    validateFeedback(feedback);
    return { category, feedback };
  }

  if (ciInfo.isCI || !process.stdin.isTTY) {
    throw new CommandError('Feedback message is required in non-interactive environments.');
  }

  const response = await prompts(
    [
      {
        type: categoryValue ? null : 'select',
        name: 'category',
        message: 'What is your feedback about?',
        choices: CLI_FEEDBACK_CATEGORIES.map((value) => ({
          title:
            value === 'unknown'
              ? 'Other / unknown'
              : value === 'evals'
                ? 'evals (a task an AI agent failed at)'
                : value,
          value,
        })),
      },
      {
        type: 'text',
        name: 'feedback',
        message: 'Share feedback with Expo',
        validate: (value) => getFeedbackValidationError(value.trim()) ?? true,
      },
    ],
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
  validateFeedback(promptedFeedback);
  return {
    category: response.category ?? category,
    feedback: promptedFeedback,
  };
}

export async function createFeedbackMetadataAsync(
  projectRoot: string,
  category: CliFeedbackCategory = 'unknown',
  subjectValue?: string,
  feedbackIdValue?: string
): Promise<CliFeedbackMetadata> {
  const subject = normalizeSubject(subjectValue);
  const feedbackId = resolveFeedbackId(feedbackIdValue);
  const context: CliFeedbackContextMetadata = {
    category,
    feedbackId,
    ...(subject ? { subject } : {}),
  };

  if (isTelemetryDisabled()) {
    return context;
  }

  return {
    ...context,
    cli: {
      name: CLI_NAME,
      version: getPackageVersion(),
    },
    agentEnvironment: getAgentEnvironment(),
    sandboxEnvironment: getSandboxEnvironment(),
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
  };
}

function getAgentEnvironment(): CliFeedbackTelemetryMetadata['agentEnvironment'] {
  const result = detectAgent();

  return result.detected && result.agent
    ? {
        detected: true,
        agent: result.agent,
      }
    : { detected: false };
}

function getSandboxEnvironment(): CliFeedbackTelemetryMetadata['sandboxEnvironment'] {
  const result = detectSandbox();

  return result.detected && result.sandbox
    ? {
        detected: true,
        sandbox: result.sandbox,
      }
    : { detected: false };
}

export function getProjectMetadata(projectRoot: string): CliFeedbackProjectMetadata {
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
}: CliFeedbackRequest & {
  session?: UserSession | null;
}): Promise<void> {
  validateFeedback(feedback);
  const telemetryDisabled = isTelemetryDisabled();
  const request: CliFeedbackRequest = { feedback, metadata };
  const response = await fetch(new URL('/v2/feedback/cli-send', getExpoApiBaseUrl()).toString(), {
    method: 'POST',
    signal: AbortSignal.timeout(FEEDBACK_TIMEOUT_MS),
    headers: {
      'Content-Type': 'application/json',
      ...(telemetryDisabled
        ? {}
        : {
            ...getAuthHeaders(session),
            'User-Agent': `${CLI_NAME}/${getPackageVersion()}`,
          }),
    },
    body: JSON.stringify(request),
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
  if (process.env.EXPO_STAGING) {
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

function printHelp(): void {
  console.log(chalk`
  {bold Usage}
    {dim $} npx submit-expo-feedback {dim <message>}

  {bold Info}
    Send feedback to the Expo team. If no message is provided, you will be prompted.
    Feedback messages can be up to ${CLI_FEEDBACK_MAX_LENGTH.toLocaleString('en-US')} characters.

  {bold Data collection}
    Feedback includes detected agent, sandbox and environment
    details, and Expo project metadata. Authenticated submissions are associated
    with your Expo account.
    Set DO_NOT_TRACK=1 or EXPO_NO_TELEMETRY=1 to omit automatically collected
    metadata and authentication.

  {bold Options}
    --category, -c <category>  Feedback category (${CLI_FEEDBACK_CATEGORIES.join(', ')})
    --subject, -s <subject>    Exact item the feedback is about, based on the category
    --resume <feedbackId>      Continue a feedback session using its ID
    --version, -v              Version number
    --help, -h                 Usage info

  {bold Subject by category}
    | Category   | Subject                                                           |
    | ---------- | ----------------------------------------------------------------- |
    | skills     | Exact skill name, such as expo-router                             |
    | docs       | Full Expo documentation URL                                       |
    | mcp        | Exact MCP tool name used                                          |
    | expo-cli   | Full Expo CLI command, such as npx expo install                   |
    | eas-cli    | Full EAS CLI command, such as eas build                           |
    | evals      | Expo package, command, or capability the task involves            |
    | simulator  | EAS Simulator feature or workflow involved                       |
    | unknown    | Concise Expo product, package, feature, or topic, or leave empty  |
`);
}

function resolveFeedbackCategory(value?: string): CliFeedbackCategory {
  const category = value?.trim().toLowerCase() || 'unknown';
  if (CLI_FEEDBACK_CATEGORIES.includes(category as CliFeedbackCategory)) {
    return category as CliFeedbackCategory;
  }
  throw new CommandError(
    `Invalid feedback category "${value}". Expected one of: ${CLI_FEEDBACK_CATEGORIES.join(', ')}.`
  );
}

function normalizeSubject(value?: string): string | undefined {
  const subject = value?.trim();
  return subject || undefined;
}

function validateFeedback(feedback: string): void {
  const error = getFeedbackValidationError(feedback);
  if (error) {
    throw new CommandError(error);
  }
}

function getFeedbackValidationError(feedback: string): string | null {
  if (!feedback) {
    return 'Feedback cannot be empty.';
  }
  if (feedback.length > CLI_FEEDBACK_MAX_LENGTH) {
    return `Feedback cannot exceed ${CLI_FEEDBACK_MAX_LENGTH.toLocaleString('en-US')} characters.`;
  }
  return null;
}

function isTelemetryDisabled(): boolean {
  return process.env.DO_NOT_TRACK === '1' || process.env.EXPO_NO_TELEMETRY === '1';
}

export function resolveFeedbackId(value?: string): string {
  if (
    value === undefined ||
    value.length < MIN_FEEDBACK_ID_LENGTH ||
    value.length > MAX_FEEDBACK_ID_LENGTH ||
    !FEEDBACK_ID_PATTERN.test(value)
  ) {
    return randomBytes(GENERATED_FEEDBACK_ID_BYTES).toString('hex');
  }

  return value;
}

function getPackageVersion(): string {
  try {
    return require('../package.json').version;
  } catch {
    return '0.0.0';
  }
}

class CommandError extends Error {}
