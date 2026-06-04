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
const DEFAULT_LOG_LIMIT = 64_000;

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
      return {
        command: [
          'rm -rf /workspace/repo',
          `git clone --filter=blob:none --no-checkout ${shellQuote(
            `https://github.com/${ref.owner}/${ref.name}.git`
          )} /workspace/repo`,
          'cd /workspace/repo',
          `git fetch --depth=1 origin ${shellQuote(ref.headSha)}`,
          `git checkout --detach ${shellQuote(ref.headSha)}`,
        ].join(' && '),
        timeout: 120_000,
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
  await sandbox.writeFile(LOG_PATH, cap(`${existing}${entry}`, limit));
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

async function handleRunPreset(env: Env, jobId: string, preset: string): Promise<Response> {
  const sandbox = getSandboxJob(env, jobId);
  const ref = await readJob(sandbox);
  const command = presetCommand(preset, ref);
  const startedAt = new Date().toISOString();

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

async function handleLogs(env: Env, jobId: string): Promise<Response> {
  const sandbox = getSandboxJob(env, jobId);
  let logs = '';
  try {
    logs = await readTextFile(sandbox, LOG_PATH);
  } catch {}
  return json({ jobId, logs: cap(logs, logLimit(env)) });
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
        return await handleRunPreset(env, jobId, parts[3]);
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
