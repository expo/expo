import { getSandbox, Sandbox } from '@cloudflare/sandbox';

export { ContainerProxy } from '@cloudflare/sandbox';

type Env = {
  Sandbox: DurableObjectNamespace<Sandbox>;
  PR_SANDBOX_AUTH_TOKEN?: string;
  PR_SANDBOX_LOG_LIMIT?: string;
};

type PullRequestRef = {
  repo: string;
  owner: string;
  name: string;
  pullNumber: number;
  headSha: string;
  prUrl?: string;
};

type PresetName =
  | 'checkout'
  | 'node_install'
  | 'node_test'
  | 'node_lint'
  | 'node_typecheck'
  | 'gradle_check'
  | 'swift_check'
  | 'cpp_check';

type PresetCommand = {
  command: string;
  cwd?: string;
  timeout: number;
};

type SandboxCommandRequest = {
  command: string;
  cwd?: string;
  timeout: number;
};

type TaskKind = 'preset' | 'command';

type TaskMetadata = {
  taskId: string;
  kind: TaskKind;
  label: string;
  command: string;
  displayCwd: string;
  sandboxCwd: string;
  timeout: number;
  startedAt: string;
};

const PRESETS = new Set<PresetName>([
  'checkout',
  'node_install',
  'node_test',
  'node_lint',
  'node_typecheck',
  'gradle_check',
  'swift_check',
  'cpp_check',
]);

const JOB_PATH = '/workspace/.pr-review/job.json';
const LOG_PATH = '/workspace/.pr-review/logs.txt';
const TASKS_DIR = '/workspace/.pr-review/tasks';
const DEFAULT_LOG_LIMIT = 64_000;
const CHECKOUT_TIMEOUT = 600_000;
const DEFAULT_COMMAND_TIMEOUT = 300_000;
const MAX_COMMAND_TIMEOUT = 600_000;
const MAX_COMMAND_LENGTH = 8_192;

export class PrReviewSandbox extends Sandbox {
  static enableInternet = false;
  static allowedHosts = [
    'github.com',
    'api.github.com',
    'codeload.github.com',
    'objects.githubusercontent.com',
    'github-releases.githubusercontent.com',
    'raw.githubusercontent.com',
    'registry.npmjs.org',
    'registry.yarnpkg.com',
    'repo.yarnpkg.com',
    'repo.maven.apache.org',
    'plugins.gradle.org',
    'services.gradle.org',
    'downloads.gradle.org',
  ];
}

function json(data: unknown, init: ResponseInit = {}): Response {
  return Response.json(data, init);
}

function error(message: string, status = 400): Response {
  return json({ error: message }, { status });
}

function authorize(request: Request, env: Env): Response | null {
  if (!env.PR_SANDBOX_AUTH_TOKEN) {
    return null;
  }
  if (request.headers.get('authorization') !== `Bearer ${env.PR_SANDBOX_AUTH_TOKEN}`) {
    return error('Unauthorized.', 401);
  }
  return null;
}

function assertRepoPart(value: unknown, name: string): string {
  if (typeof value !== 'string' || !/^[A-Za-z0-9_.-]+$/.test(value)) {
    throw new Error(`${name} must contain only GitHub-safe chars.`);
  }
  return value;
}

function normalizePullRequestRef(input: any): PullRequestRef {
  const owner = assertRepoPart(input.owner, 'owner');
  const name = assertRepoPart(input.name, 'name');
  const pullNumber = Number(input.pullNumber);
  const headSha = String(input.headSha ?? '').toLowerCase();

  if (!Number.isInteger(pullNumber) || pullNumber <= 0) {
    throw new Error('pullNumber must be a positive integer.');
  }
  if (!/^[a-f0-9]{40}$/.test(headSha)) {
    throw new Error('headSha must be a 40-character hexadecimal commit SHA.');
  }

  return {
    owner,
    name,
    repo: `${owner}/${name}`,
    pullNumber,
    headSha,
    prUrl: typeof input.prUrl === 'string' ? input.prUrl : undefined,
  };
}

function createJobId(ref: PullRequestRef): string {
  const repo = `${ref.owner}-${ref.name}`.toLowerCase().replace(/[^a-z0-9-]/g, '-');
  return `pr-${repo}-${ref.pullNumber}-${ref.headSha.slice(0, 12)}`;
}

function shellQuote(value: string): string {
  return `'${value.replace(/'/g, `'\\''`)}'`;
}

function getGitHubCloneUrl(ref: PullRequestRef): string {
  return `https://github.com/${ref.owner}/${ref.name}.git`;
}

function validatePreset(preset: string): PresetName {
  if (!PRESETS.has(preset as PresetName)) {
    throw new Error(`Unsupported sandbox preset "${preset}".`);
  }
  return preset as PresetName;
}

function scriptCommand(scriptName: string): string {
  return [
    `if node -e "const p=require('./package.json'); process.exit(p.scripts && p.scripts[${JSON.stringify(
      scriptName
    )}] ? 0 : 1)" 2>/dev/null; then`,
    `  if [ -f pnpm-lock.yaml ]; then corepack enable pnpm >/dev/null 2>&1 || true; pnpm run ${scriptName};`,
    `  elif [ -f yarn.lock ]; then corepack enable yarn >/dev/null 2>&1 || true; yarn run ${scriptName};`,
    `  elif [ -f bun.lock ] || [ -f bun.lockb ]; then bun run ${scriptName};`,
    `  else npm run ${scriptName}; fi`,
    `else echo "sandbox execution skipped: package.json has no ${scriptName} script"; fi`,
  ].join(' ');
}

function typecheckCommand(): string {
  return [
    'if node -e "const p=require(\'./package.json\'); process.exit(p.scripts && p.scripts.typecheck ? 0 : 1)" 2>/dev/null; then',
    '  if [ -f pnpm-lock.yaml ]; then corepack enable pnpm >/dev/null 2>&1 || true; pnpm run typecheck;',
    '  elif [ -f yarn.lock ]; then corepack enable yarn >/dev/null 2>&1 || true; yarn run typecheck;',
    '  elif [ -f bun.lock ] || [ -f bun.lockb ]; then bun run typecheck;',
    '  else npm run typecheck; fi',
    'elif [ -x node_modules/.bin/tsc ]; then node_modules/.bin/tsc --noEmit;',
    'else echo "sandbox execution skipped: no typecheck script or local tsc found"; fi',
  ].join(' ');
}

function presetCommand(preset: string, ref?: PullRequestRef): PresetCommand {
  switch (validatePreset(preset)) {
    case 'checkout':
      if (!ref) {
        throw new Error('The checkout preset requires PR metadata.');
      }
      const cloneUrl = shellQuote(getGitHubCloneUrl(ref));
      const headSha = shellQuote(ref.headSha);
      const pullRef = shellQuote(`refs/pull/${ref.pullNumber}/head`);
      return {
        command: [
          'rm -rf /workspace/repo',
          'mkdir -p /workspace/repo',
          'cd /workspace/repo',
          'git init -q',
          'git config gc.auto 0',
          'git config maintenance.auto false',
          'git config fetch.writeCommitGraph false',
          'git config advice.detachedHead false',
          `git remote add origin ${cloneUrl}`,
          'git config remote.origin.promisor true',
          'git config remote.origin.partialclonefilter blob:none',
          [
            '(',
            `git -c protocol.version=2 fetch --depth=1 --filter=blob:none --no-tags origin ${pullRef}`,
            '||',
            `git -c protocol.version=2 fetch --depth=1 --filter=blob:none --no-tags origin ${headSha}`,
            ')',
          ].join(' '),
          `test "$(git rev-parse FETCH_HEAD)" = ${headSha}`,
          'git checkout --detach --force FETCH_HEAD',
          `printf '%s\\n' ${headSha} > /workspace/.pr-review/head-sha.txt`,
        ].join(' && '),
        timeout: CHECKOUT_TIMEOUT,
      };
    case 'node_install':
      return {
        command: [
          'if [ -f pnpm-lock.yaml ]; then corepack enable pnpm >/dev/null 2>&1 || true; pnpm install --frozen-lockfile;',
          'elif [ -f yarn.lock ]; then corepack enable yarn >/dev/null 2>&1 || true; yarn install --immutable || yarn install --frozen-lockfile;',
          'elif [ -f package-lock.json ] || [ -f npm-shrinkwrap.json ]; then npm ci;',
          'elif [ -f bun.lock ] || [ -f bun.lockb ]; then bun install --frozen-lockfile;',
          'elif [ -f package.json ]; then npm install;',
          'else echo "sandbox execution skipped: no Node project manifest found"; fi',
        ].join(' '),
        cwd: '/workspace/repo',
        timeout: 600_000,
      };
    case 'node_test':
      return { command: scriptCommand('test'), cwd: '/workspace/repo', timeout: 300_000 };
    case 'node_lint':
      return { command: scriptCommand('lint'), cwd: '/workspace/repo', timeout: 300_000 };
    case 'node_typecheck':
      return {
        command: typecheckCommand(),
        cwd: '/workspace/repo',
        timeout: 300_000,
      };
    case 'gradle_check':
      return {
        command:
          'if [ -x ./gradlew ]; then ./gradlew test; elif [ -f ./gradlew ]; then sh ./gradlew test; else echo "sandbox execution skipped: no gradlew found"; fi',
        cwd: '/workspace/repo',
        timeout: 300_000,
      };
    case 'swift_check':
      return {
        command:
          'if [ -f Package.swift ] && command -v swift >/dev/null 2>&1; then swift test; elif [ -f Package.swift ]; then echo "sandbox execution skipped: swift is not installed in this sandbox image"; else echo "sandbox execution skipped: no Package.swift found"; fi',
        cwd: '/workspace/repo',
        timeout: 300_000,
      };
    case 'cpp_check':
      return {
        command:
          'if [ -f CMakeLists.txt ]; then cmake -S . -B build && cmake --build build --parallel; else echo "sandbox execution skipped: no CMakeLists.txt found"; fi',
        cwd: '/workspace/repo',
        timeout: 300_000,
      };
  }

  throw new Error(`Unsupported sandbox preset "${preset}".`);
}

function normalizePath(path: string): string {
  const normalized = path.replace(/\\/g, '/').replace(/^\.\/+/, '');
  if (
    !normalized ||
    normalized.startsWith('/') ||
    normalized === '..' ||
    normalized.startsWith('../') ||
    normalized.includes('/../') ||
    normalized.endsWith('/..')
  ) {
    throw new Error('File path must be relative to the checked-out repository.');
  }
  return normalized;
}

function normalizeCwd(cwd: unknown): { displayCwd: string; sandboxCwd: string } {
  if (cwd == null) {
    return { displayCwd: '.', sandboxCwd: '/workspace/repo' };
  }
  if (typeof cwd !== 'string') {
    throw new Error('cwd must be a repo-relative path.');
  }
  const normalized = cwd
    .replace(/\\/g, '/')
    .replace(/^\.\/+/, '')
    .replace(/\/+$/, '');
  if (!normalized || normalized === '.') {
    return { displayCwd: '.', sandboxCwd: '/workspace/repo' };
  }
  const displayCwd = normalizePath(normalized);
  return { displayCwd, sandboxCwd: `/workspace/repo/${displayCwd}` };
}

function normalizeCommandRequest(input: unknown): SandboxCommandRequest {
  const data = input && typeof input === 'object' ? (input as Record<string, unknown>) : {};
  const command = typeof data.command === 'string' ? data.command.trim() : '';
  if (!command) {
    throw new Error('command must be a non-empty string.');
  }
  if (command.length > MAX_COMMAND_LENGTH || command.includes('\0')) {
    throw new Error(`command must be 1-${MAX_COMMAND_LENGTH} characters.`);
  }

  const timeout =
    data.timeout == null || data.timeout === '' ? DEFAULT_COMMAND_TIMEOUT : Number(data.timeout);
  if (!Number.isInteger(timeout) || timeout <= 0 || timeout > MAX_COMMAND_TIMEOUT) {
    throw new Error(`timeout must be a positive integer up to ${MAX_COMMAND_TIMEOUT}.`);
  }

  return {
    command,
    cwd: normalizeCwd(data.cwd).displayCwd,
    timeout,
  };
}

function logLimit(env: Env): number {
  const value = Number(env.PR_SANDBOX_LOG_LIMIT);
  return Number.isInteger(value) && value > 0 ? value : DEFAULT_LOG_LIMIT;
}

function redact(input: string): string {
  return input.replace(
    /\b(CODEX_API_KEY|OPENAI_API_KEY|GITHUB_TOKEN|GH_TOKEN|CLOUDFLARE_API_TOKEN|CLOUDFLARE_TOKEN|NPM_TOKEN|YARN_NPM_AUTH_TOKEN|BUN_AUTH_TOKEN)\b\s*[:=]\s*['"]?[^'"\s]+['"]?/gi,
    '$1=[redacted]'
  );
}

function cap(input: string, limit: number): string {
  const redacted = redact(input);
  if (redacted.length <= limit) {
    return redacted;
  }
  return `${redacted.slice(0, limit)}\n[truncated ${redacted.length - limit} characters]`;
}

function errorMessage(caught: unknown): string {
  return caught instanceof Error ? caught.message : String(caught);
}

async function readTextFile(sandbox: Sandbox, path: string): Promise<string> {
  const file = await sandbox.readFile(path);
  if (typeof file.content !== 'string') {
    throw new Error(`Expected text file content for ${path}.`);
  }
  return file.content;
}

async function appendLog(sandbox: Sandbox, entry: string, limit: number) {
  let existing = '';
  try {
    existing = await readTextFile(sandbox, LOG_PATH);
  } catch {}
  try {
    await sandbox.writeFile(LOG_PATH, cap(`${existing}${entry}`, limit));
  } catch (caught) {
    try {
      await sandbox.writeFile(
        LOG_PATH,
        cap(`\n[log write failed: ${errorMessage(caught)}]\n${entry}`, Math.min(limit, 16_000))
      );
    } catch {}
  }
}

async function readOptionalTextFile(sandbox: Sandbox, path: string): Promise<string | undefined> {
  try {
    return await readTextFile(sandbox, path);
  } catch {
    return undefined;
  }
}

function createTaskId(): string {
  return crypto.randomUUID();
}

function assertTaskId(taskId: string): string {
  if (!/^[a-f0-9-]{36}$/.test(taskId)) {
    throw new Error('Invalid task id.');
  }
  return taskId;
}

function taskDir(taskId: string): string {
  return `${TASKS_DIR}/${assertTaskId(taskId)}`;
}

function taskPath(taskId: string, name: string): string {
  return `${taskDir(taskId)}/${name}`;
}

function taskResponseRunning(metadata: TaskMetadata) {
  return {
    taskId: metadata.taskId,
    status: 'running',
    startedAt: metadata.startedAt,
    timeout: metadata.timeout,
  };
}

function createTaskResult(metadata: TaskMetadata, exitCode: number, stdout: string, stderr: string) {
  if (metadata.kind === 'preset') {
    return {
      preset: metadata.label,
      success: exitCode === 0,
      exitCode,
      stdout,
      stderr,
    };
  }
  return {
    command: metadata.command,
    cwd: metadata.displayCwd,
    success: exitCode === 0,
    exitCode,
    stdout,
    stderr,
  };
}

async function readTaskMetadata(sandbox: Sandbox, taskId: string): Promise<TaskMetadata> {
  return JSON.parse(await readTextFile(sandbox, taskPath(taskId, 'metadata.json')));
}

async function startDetachedTask(
  sandbox: Sandbox,
  env: Env,
  metadata: TaskMetadata
): Promise<Response> {
  const dir = taskDir(metadata.taskId);
  const commandPath = taskPath(metadata.taskId, 'command.sh');
  const runPath = taskPath(metadata.taskId, 'run.sh');
  const stdoutPath = taskPath(metadata.taskId, 'stdout.txt');
  const stderrPath = taskPath(metadata.taskId, 'stderr.txt');
  const exitCodePath = taskPath(metadata.taskId, 'exit-code.txt');
  const finishedAtPath = taskPath(metadata.taskId, 'finished-at.txt');
  const pidPath = taskPath(metadata.taskId, 'pid.txt');
  const timeoutSeconds = Math.max(1, Math.ceil(metadata.timeout / 1000));

  await sandbox.mkdir(dir, { recursive: true });
  await sandbox.writeFile(taskPath(metadata.taskId, 'metadata.json'), JSON.stringify(metadata, null, 2));
  await sandbox.writeFile(commandPath, `${metadata.command}\n`);
  await sandbox.writeFile(
    runPath,
    [
      '#!/bin/sh',
      'set +e',
      `if ! cd ${shellQuote(metadata.sandboxCwd)}; then`,
      `  echo ${shellQuote(`Unable to enter cwd: ${metadata.displayCwd}`)} > ${shellQuote(
        stderrPath
      )}`,
      `  printf '%s\\n' 127 > ${shellQuote(exitCodePath)}`,
      `  date -u '+%Y-%m-%dT%H:%M:%SZ' > ${shellQuote(finishedAtPath)}`,
      '  exit 127',
      'fi',
      'if command -v timeout >/dev/null 2>&1; then',
      `  timeout ${shellQuote(`${timeoutSeconds}s`)} sh ${shellQuote(commandPath)} > ${shellQuote(
        stdoutPath
      )} 2> ${shellQuote(stderrPath)}`,
      'else',
      `  sh ${shellQuote(commandPath)} > ${shellQuote(stdoutPath)} 2> ${shellQuote(stderrPath)}`,
      'fi',
      'code=$?',
      `printf '%s\\n' "$code" > ${shellQuote(exitCodePath)}`,
      `date -u '+%Y-%m-%dT%H:%M:%SZ' > ${shellQuote(finishedAtPath)}`,
      'exit "$code"',
      '',
    ].join('\n')
  );

  const launch = await sandbox.exec(
    `sh ${shellQuote(runPath)} >/dev/null 2>&1 & echo $! > ${shellQuote(pidPath)}`,
    {
      cwd: '/workspace',
      timeout: 10_000,
    }
  );
  if (!launch.success) {
    throw new Error(launch.stderr || launch.stdout || 'Unable to start sandbox task.');
  }

  await appendLog(
    sandbox,
    [
      `\n## ${metadata.label} (${metadata.startedAt})`,
      `$ ${metadata.command}`,
      `cwd: ${metadata.displayCwd}`,
      `[task ${metadata.taskId} running]`,
    ].join('\n'),
    logLimit(env)
  );

  return json(taskResponseRunning(metadata), { status: 202 });
}

async function getTaskStatus(sandbox: Sandbox, env: Env, taskId: string): Promise<Response> {
  const metadata = await readTaskMetadata(sandbox, taskId);
  const exitCodeText = await readOptionalTextFile(sandbox, taskPath(taskId, 'exit-code.txt'));
  if (exitCodeText == null) {
    return json(taskResponseRunning(metadata));
  }

  const exitCode = Number(exitCodeText.trim());
  if (!Number.isInteger(exitCode)) {
    return json(
      {
        taskId,
        status: 'failed',
        startedAt: metadata.startedAt,
        timeout: metadata.timeout,
        error: `Invalid task exit code: ${exitCodeText.trim()}`,
      },
      { status: 500 }
    );
  }

  const limit = logLimit(env);
  const stdout = cap((await readOptionalTextFile(sandbox, taskPath(taskId, 'stdout.txt'))) ?? '', limit);
  const stderr = cap((await readOptionalTextFile(sandbox, taskPath(taskId, 'stderr.txt'))) ?? '', limit);
  const finishedAt =
    (await readOptionalTextFile(sandbox, taskPath(taskId, 'finished-at.txt')))?.trim() ??
    new Date().toISOString();

  if ((await readOptionalTextFile(sandbox, taskPath(taskId, 'logged.txt'))) == null) {
    await appendLog(
      sandbox,
      [
        `\n## ${metadata.label} completed (${finishedAt})`,
        stdout ? `\n[stdout]\n${stdout}` : '',
        stderr ? `\n[stderr]\n${stderr}` : '',
        `\n[exit ${exitCode}]`,
      ].join('\n'),
      limit
    );
    await sandbox.writeFile(taskPath(taskId, 'logged.txt'), '1').catch(() => {});
  }

  return json({
    taskId,
    status: 'completed',
    startedAt: metadata.startedAt,
    finishedAt,
    timeout: metadata.timeout,
    result: createTaskResult(metadata, exitCode, stdout, stderr),
  });
}

async function readJob(sandbox: Sandbox): Promise<PullRequestRef> {
  return JSON.parse(await readTextFile(sandbox, JOB_PATH));
}

function getSandboxJob(env: Env, jobId: string): Sandbox {
  return getSandbox(env.Sandbox, jobId, {
    normalizeId: true,
    sleepAfter: '5m',
  });
}

async function handleCreateJob(request: Request, env: Env): Promise<Response> {
  const ref = normalizePullRequestRef(await request.json());
  const jobId = createJobId(ref);
  const sandbox = getSandboxJob(env, jobId);

  await sandbox.mkdir('/workspace/.pr-review', { recursive: true });
  await sandbox.writeFile(JOB_PATH, JSON.stringify(ref, null, 2));
  await sandbox.writeFile(LOG_PATH, '');

  return json({ jobId, repo: ref.repo, pullNumber: ref.pullNumber, headSha: ref.headSha });
}

async function handleRunPreset(
  request: Request,
  env: Env,
  jobId: string,
  preset: string
): Promise<Response> {
  const sandbox = getSandboxJob(env, jobId);
  const ref = await readJob(sandbox);
  const command = presetCommand(preset, ref);
  const startedAt = new Date().toISOString();

  if (new URL(request.url).searchParams.get('async') === '1') {
    return await startDetachedTask(sandbox, env, {
      taskId: createTaskId(),
      kind: 'preset',
      label: validatePreset(preset),
      command: command.command,
      displayCwd: command.cwd ?? '/workspace',
      sandboxCwd: command.cwd ?? '/workspace',
      timeout: command.timeout,
      startedAt,
    });
  }

  try {
    const result = await sandbox.exec(command.command, {
      cwd: command.cwd,
      timeout: command.timeout,
    });
    const entry = [
      `\n## ${preset} (${startedAt})`,
      `$ ${command.command}`,
      result.stdout ? `\n[stdout]\n${result.stdout}` : '',
      result.stderr ? `\n[stderr]\n${result.stderr}` : '',
      `\n[exit ${result.exitCode}]`,
    ].join('\n');
    await appendLog(sandbox, entry, logLimit(env));

    return json({
      preset,
      success: result.success,
      exitCode: result.exitCode,
      stdout: cap(result.stdout ?? '', logLimit(env)),
      stderr: cap(result.stderr ?? '', logLimit(env)),
    });
  } catch (caught) {
    await sandbox.killAllProcesses().catch(() => {});
    const message = caught instanceof Error ? caught.message : String(caught);
    await appendLog(
      sandbox,
      `\n## ${preset} (${startedAt})\n$ ${command.command}\n[error]\n${message}\n`,
      logLimit(env)
    );
    return json({ preset, success: false, error: message }, { status: 500 });
  }
}

async function handleRunCommand(request: Request, env: Env, jobId: string): Promise<Response> {
  const sandbox = getSandboxJob(env, jobId);
  await readJob(sandbox);
  const command = normalizeCommandRequest(await request.json());
  const { sandboxCwd } = normalizeCwd(command.cwd);
  const startedAt = new Date().toISOString();

  if (new URL(request.url).searchParams.get('async') === '1') {
    return await startDetachedTask(sandbox, env, {
      taskId: createTaskId(),
      kind: 'command',
      label: 'command',
      command: command.command,
      displayCwd: command.cwd,
      sandboxCwd,
      timeout: command.timeout,
      startedAt,
    });
  }

  try {
    const result = await sandbox.exec(command.command, {
      cwd: sandboxCwd,
      timeout: command.timeout,
    });
    const entry = [
      `\n## command (${startedAt})`,
      `$ ${command.command}`,
      `cwd: ${command.cwd}`,
      result.stdout ? `\n[stdout]\n${result.stdout}` : '',
      result.stderr ? `\n[stderr]\n${result.stderr}` : '',
      `\n[exit ${result.exitCode}]`,
    ].join('\n');
    await appendLog(sandbox, entry, logLimit(env));

    return json({
      command: command.command,
      cwd: command.cwd,
      success: result.success,
      exitCode: result.exitCode,
      stdout: cap(result.stdout ?? '', logLimit(env)),
      stderr: cap(result.stderr ?? '', logLimit(env)),
    });
  } catch (caught) {
    await sandbox.killAllProcesses().catch(() => {});
    const message = caught instanceof Error ? caught.message : String(caught);
    await appendLog(
      sandbox,
      `\n## command (${startedAt})\n$ ${command.command}\ncwd: ${command.cwd}\n[error]\n${message}\n`,
      logLimit(env)
    );
    return json(
      { command: command.command, cwd: command.cwd, success: false, error: message },
      { status: 500 }
    );
  }
}

async function handleLogs(env: Env, jobId: string): Promise<Response> {
  const sandbox = getSandboxJob(env, jobId);
  let logs = '';
  try {
    logs = await readTextFile(sandbox, LOG_PATH);
  } catch {}
  return json({ jobId, logs: cap(logs, logLimit(env)) });
}

async function handleTask(env: Env, jobId: string, taskId: string): Promise<Response> {
  const sandbox = getSandboxJob(env, jobId);
  await readJob(sandbox);
  return await getTaskStatus(sandbox, env, taskId);
}

async function handleReadFile(env: Env, jobId: string, filePath: string | null): Promise<Response> {
  if (!filePath) {
    return error('Provide path query parameter.');
  }
  const normalized = normalizePath(filePath);
  const sandbox = getSandboxJob(env, jobId);
  const content = await readTextFile(sandbox, `/workspace/repo/${normalized}`);
  return json({ jobId, path: normalized, content });
}

async function handleDestroyJob(env: Env, jobId: string): Promise<Response> {
  await getSandboxJob(env, jobId).destroy();
  return json({ jobId, destroyed: true });
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const unauthorized = authorize(request, env);
    if (unauthorized) {
      return unauthorized;
    }

    const url = new URL(request.url);
    const parts = url.pathname.split('/').filter(Boolean);

    try {
      if (request.method === 'POST' && parts.length === 1 && parts[0] === 'jobs') {
        return await handleCreateJob(request, env);
      }

      if (parts[0] !== 'jobs' || !parts[1]) {
        return error('Not found.', 404);
      }

      const jobId = parts[1];
      if (request.method === 'POST' && parts[2] === 'presets' && parts[3]) {
        return await handleRunPreset(request, env, jobId, parts[3]);
      }
      if (request.method === 'POST' && parts[2] === 'commands' && parts.length === 3) {
        return await handleRunCommand(request, env, jobId);
      }
      if (request.method === 'GET' && parts[2] === 'tasks' && parts[3]) {
        return await handleTask(env, jobId, parts[3]);
      }
      if (request.method === 'GET' && parts[2] === 'logs') {
        return await handleLogs(env, jobId);
      }
      if (request.method === 'GET' && parts[2] === 'files') {
        return await handleReadFile(env, jobId, url.searchParams.get('path'));
      }
      if (request.method === 'DELETE' && parts.length === 2) {
        return await handleDestroyJob(env, jobId);
      }

      return error('Not found.', 404);
    } catch (caught) {
      return error(caught instanceof Error ? caught.message : String(caught), 500);
    }
  },
};
