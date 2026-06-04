import type { PullRequestRef } from './types';
import { validateSandboxPreset } from './validation';

const CHECKOUT_TIMEOUT_MS = 600_000;
const INSTALL_TIMEOUT_MS = 600_000;
const CHECK_TIMEOUT_MS = 300_000;

export type PresetCommand = {
  command: string;
  cwd?: string;
  timeout: number;
};

function shellQuote(value: string): string {
  return `'${value.replace(/'/g, `'\\''`)}'`;
}

function getGitHubCloneUrl(ref: PullRequestRef): string {
  return `https://github.com/${ref.owner}/${ref.name}.git`;
}

function getNodePackageManagerScript(scriptName: string): string {
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

function getNodeTypecheckScript(): string {
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

export function createPresetCommand(presetInput: string, ref?: PullRequestRef): PresetCommand {
  const preset = validateSandboxPreset(presetInput);

  switch (preset) {
    case 'checkout': {
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
        timeout: CHECKOUT_TIMEOUT_MS,
      };
    }
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
        timeout: INSTALL_TIMEOUT_MS,
      };
    case 'node_test':
      return {
        command: getNodePackageManagerScript('test'),
        cwd: '/workspace/repo',
        timeout: CHECK_TIMEOUT_MS,
      };
    case 'node_lint':
      return {
        command: getNodePackageManagerScript('lint'),
        cwd: '/workspace/repo',
        timeout: CHECK_TIMEOUT_MS,
      };
    case 'node_typecheck':
      return {
        command: getNodeTypecheckScript(),
        cwd: '/workspace/repo',
        timeout: CHECK_TIMEOUT_MS,
      };
    case 'gradle_check':
      return {
        command:
          'if [ -x ./gradlew ]; then ./gradlew test; elif [ -f ./gradlew ]; then sh ./gradlew test; else echo "sandbox execution skipped: no gradlew found"; fi',
        cwd: '/workspace/repo',
        timeout: CHECK_TIMEOUT_MS,
      };
    case 'swift_check':
      return {
        command:
          'if [ -f Package.swift ] && command -v swift >/dev/null 2>&1; then swift test; elif [ -f Package.swift ]; then echo "sandbox execution skipped: swift is not installed in this sandbox image"; else echo "sandbox execution skipped: no Package.swift found"; fi',
        cwd: '/workspace/repo',
        timeout: CHECK_TIMEOUT_MS,
      };
    case 'cpp_check':
      return {
        command:
          'if [ -f CMakeLists.txt ]; then cmake -S . -B build && cmake --build build --parallel; else echo "sandbox execution skipped: no CMakeLists.txt found"; fi',
        cwd: '/workspace/repo',
        timeout: CHECK_TIMEOUT_MS,
      };
  }

  throw new Error(`Unsupported sandbox preset "${preset}".`);
}
