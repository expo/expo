// The four things `runTypeCheckAsync` decides: whether there is anything to check, what the
// compiler is run with, what its diagnostics amount to, and which of its failures are the tool's
// rather than the project's.
import { vol } from 'memfs';

import { spawnSubprocessAsync } from '../../utils/subprocess';
import { resolveTsConfigPath, resolveTypeScriptCli, runTypeCheckAsync, TSC_ARGS } from '../checkAsync';

jest.mock('../../utils/subprocess', () => ({ spawnSubprocessAsync: jest.fn() }));

const spawn = spawnSubprocessAsync as jest.MockedFunction<typeof spawnSubprocessAsync>;
const projectRoot = '/project';
/** A hoisted npm workspace: the app has no `node_modules` of its own (F113). */
const workspaceRoot = '/workspace';
const hoistedProjectRoot = `${workspaceRoot}/apps/mobile`;

/** A project with a compiler and a config, i.e. one there is something to check in. */
function typeScriptProject(): void {
  vol.fromJSON({
    [`${projectRoot}/package.json`]: '{"name":"app"}',
    [`${projectRoot}/tsconfig.json`]: '{}',
    [`${projectRoot}/node_modules/.bin/tsc`]: '',
  });
}

function answers(output: { stdout?: string; stderr?: string; exitCode: number | null }): void {
  spawn.mockResolvedValue({ stdout: '', stderr: '', ...output });
}

afterEach(() => {
  vol.reset();
});

describe(resolveTypeScriptCli, () => {
  it(`should find the project's own compiler`, () => {
    typeScriptProject();

    expect(resolveTypeScriptCli(projectRoot)).toEqual({
      command: `${projectRoot}/node_modules/.bin/tsc`,
    });
  });

  // F113: an npm workspace hoists so completely that the app has no `node_modules` of its own, and
  // the compiler the app pinned is installed at the workspace root. It is still the project's own
  // compiler — Node resolves it from here — so the "no registry fallback" rule is untouched.
  it(`should find the compiler an npm workspace hoisted above the project`, () => {
    vol.fromJSON({
      [`${workspaceRoot}/package.json`]: '{"workspaces":["apps/*"]}',
      [`${workspaceRoot}/node_modules/.bin/tsc`]: '',
      [`${hoistedProjectRoot}/package.json`]: '{"name":"mobile"}',
      [`${hoistedProjectRoot}/tsconfig.json`]: '{}',
    });

    expect(resolveTypeScriptCli(hoistedProjectRoot)).toEqual({
      command: `${workspaceRoot}/node_modules/.bin/tsc`,
    });
  });

  // Deliberately no `npx typescript` fallback: a compiler from the registry would answer a
  // question about a project that does not exist.
  it(`should answer null rather than reaching for one from the registry`, () => {
    vol.fromJSON({ [`${projectRoot}/tsconfig.json`]: '{}' });

    expect(resolveTypeScriptCli(projectRoot)).toBeNull();
  });
});

describe(resolveTsConfigPath, () => {
  it(`should find the config the compiler would use`, () => {
    typeScriptProject();

    expect(resolveTsConfigPath(projectRoot)).toBe(`${projectRoot}/tsconfig.json`);
  });

  it(`should answer null for a project with none`, () => {
    vol.fromJSON({ [`${projectRoot}/package.json`]: '{}' });

    expect(resolveTsConfigPath(projectRoot)).toBeNull();
  });
});

describe(runTypeCheckAsync, () => {
  it(`should run the project's compiler with --noEmit and the terse form`, async () => {
    typeScriptProject();
    answers({ exitCode: 0 });

    const report = await runTypeCheckAsync(projectRoot);

    expect(spawn).toHaveBeenCalledWith(`${projectRoot}/node_modules/.bin/tsc`, TSC_ARGS, {
      cwd: projectRoot,
      output: 'capture',
    });
    expect(TSC_ARGS).toEqual(['--noEmit', '--pretty', 'false']);
    expect(report).toMatchObject({ checked: true, reason: null, errorCount: 0, errors: [] });
  });

  it(`should report the diagnostics the compiler printed`, async () => {
    typeScriptProject();
    answers({
      exitCode: 2,
      stdout: `src/app/notes.tsx(66,22): error TS2339: Property 'md' does not exist on type '{ readonly two: 8; }'.\n`,
    });

    const report = await runTypeCheckAsync(projectRoot);

    expect(report.checked).toBe(true);
    expect(report.errorCount).toBe(1);
    expect(report.errors[0]).toEqual({
      file: 'src/app/notes.tsx',
      line: 66,
      column: 22,
      code: 'TS2339',
      message: expect.stringContaining(`Property 'md' does not exist`),
    });
  });

  it(`should read the diagnostics off stderr as well as stdout`, async () => {
    typeScriptProject();
    answers({ exitCode: 2, stderr: `src/a.ts(1,1): error TS2304: Cannot find name 'nope'.\n` });

    await expect(runTypeCheckAsync(projectRoot)).resolves.toMatchObject({ errorCount: 1 });
  });

  // A project with no TypeScript in it has nothing to check, which is an answer and not a failure.
  it(`should report that a JavaScript project has nothing to check`, async () => {
    vol.fromJSON({
      [`${projectRoot}/package.json`]: '{}',
      [`${projectRoot}/src/app/index.js`]: '',
      // Generated into every Expo app, JavaScript ones included, so it must not count as evidence.
      [`${projectRoot}/expo-env.d.ts`]: '',
    });

    const report = await runTypeCheckAsync(projectRoot);

    expect(report).toEqual({
      projectRoot,
      checked: false,
      reason: expect.stringContaining('no TypeScript in it'),
      errorCount: 0,
      errors: [],
      durationMs: 0,
      generatedTypes: null,
    });
    expect(spawn).not.toHaveBeenCalled();
  });

  // @ref llp/0010-agent-conventions.rfc.md §The fourth: `typecheck` — the three states, and the
  // two that used to be one. A gate reading the exit code saw a broken TypeScript setup as a pass.
  it(`should fail a TypeScript project whose compiler is missing, and say so differently`, async () => {
    vol.fromJSON({
      [`${projectRoot}/package.json`]: '{}',
      [`${projectRoot}/tsconfig.json`]: '{}',
      [`${projectRoot}/src/app/index.tsx`]: '',
    });

    await expect(runTypeCheckAsync(projectRoot)).rejects.toMatchObject({
      code: 'TYPECHECK_CLI_MISSING',
      suggestedCommand: 'npx @expo/agent-cli install typescript --dev',
    });
    expect(spawn).not.toHaveBeenCalled();
  });

  // The other half of F113: the advice. A reader whose dependencies *are* installed — hoisted to a
  // workspace root that does not have TypeScript in it — was told to install them, which is the one
  // thing that cannot help. What the search covered replaces the guess.
  it(`should say what was searched rather than assume nothing is installed`, async () => {
    vol.fromJSON({
      [`${projectRoot}/package.json`]: '{}',
      [`${projectRoot}/tsconfig.json`]: '{}',
    });

    const error = await runTypeCheckAsync(projectRoot).catch((error) => error);

    expect(error.code).toBe('TYPECHECK_CLI_MISSING');
    expect(error.message).toContain('every directory above it');
    expect(error.message).not.toContain(`install the project's dependencies`);
    // The What/Why/How shape of the contract is unchanged; only the How's claim is.
    expect(error.message).toContain('nothing was type-checked');
    expect(error.message).toContain('Why:');
    expect(error.message).toContain('How:');
    expect(error.suggestedCommand).toBe('npx @expo/agent-cli install typescript --dev');
  });

  // Evidence from the sources alone: a project can lose its `tsconfig.json` and still be one.
  it(`should fail on .ts sources with no tsconfig and no compiler`, async () => {
    vol.fromJSON({
      [`${projectRoot}/package.json`]: '{}',
      [`${projectRoot}/src/app/index.tsx`]: '',
    });

    await expect(runTypeCheckAsync(projectRoot)).rejects.toMatchObject({
      code: 'TYPECHECK_CLI_MISSING',
      message: expect.stringContaining('.ts or .tsx source files'),
    });
  });

  it(`should not look for sources inside node_modules`, async () => {
    vol.fromJSON({
      [`${projectRoot}/package.json`]: '{}',
      [`${projectRoot}/index.js`]: '',
      [`${projectRoot}/node_modules/some-lib/index.ts`]: '',
    });

    await expect(runTypeCheckAsync(projectRoot)).resolves.toMatchObject({ checked: false });
  });

  it(`should report that a project without a tsconfig has nothing to check`, async () => {
    vol.fromJSON({
      [`${projectRoot}/package.json`]: '{}',
      [`${projectRoot}/node_modules/.bin/tsc`]: '',
    });

    const report = await runTypeCheckAsync(projectRoot);

    expect(report.checked).toBe(false);
    expect(report.reason).toContain('no tsconfig.json');
    expect(spawn).not.toHaveBeenCalled();
  });

  // A compiler that failed and printed nothing a parse can read has not answered the question, so
  // it is a tool failure. Reporting it as an outcome would send an agent looking for a type error
  // that was never reported.
  it(`should fail as the tool when the compiler said nothing readable`, async () => {
    typeScriptProject();
    answers({ exitCode: 1, stderr: 'Killed: 9\n' });

    await expect(runTypeCheckAsync(projectRoot)).rejects.toMatchObject({
      code: 'TYPECHECK_FAILED',
    });
    await expect(runTypeCheckAsync(projectRoot)).rejects.toThrow(/Killed: 9/);
  });

  it(`should fail as the tool when the compiler could not be spawned`, async () => {
    typeScriptProject();
    spawn.mockResolvedValue({
      exitCode: null,
      stdout: '',
      stderr: '',
      spawnError: Object.assign(new Error('spawn EACCES'), { code: 'EACCES' }),
    });

    await expect(runTypeCheckAsync(projectRoot)).rejects.toMatchObject({
      code: 'TYPECHECK_CLI_NOT_RUNNABLE',
    });
  });
});

// @ref llp/0021-honest-reports.rfc.md §A generated file is not a mistake in the code —
// friction run 7, F64. A brand-new project's first gate was red for a file the Expo CLI writes, and
// the follow-up said to fix two files that were both correct.
describe('a declaration file the project expects and does not have', () => {
  /** A TypeScript project whose `tsconfig.json` includes the generated file. */
  function withExpoTsConfig(files: Record<string, string> = {}) {
    vol.fromJSON({
      [`${projectRoot}/package.json`]: '{}',
      [`${projectRoot}/tsconfig.json`]: JSON.stringify({
        extends: 'expo/tsconfig.base',
        include: ['**/*.ts', '**/*.tsx', '.expo/types/**/*.ts', 'expo-env.d.ts'],
      }),
      [`${projectRoot}/node_modules/.bin/tsc`]: '#!/bin/sh',
      [`${projectRoot}/src/app/index.tsx`]: '',
      ...files,
    });
  }

  it(`should name the missing file and the command that writes it`, async () => {
    withExpoTsConfig();
    answers({
      exitCode: 2,
      stdout: `src/constants/theme.ts(6,8): error TS2882: Cannot find module or type declarations for side-effect import of '@/global.css'.\n`,
    });

    const report = await runTypeCheckAsync(projectRoot);

    expect(report.errorCount).toBe(1);
    expect(report.generatedTypes).toEqual({
      file: 'expo-env.d.ts',
      referencedBy: 'tsconfig.json',
      command: 'npx @expo/agent-cli dev --detach --wait-ready',
    });
  });

  it(`should say nothing once the file exists`, async () => {
    withExpoTsConfig({ [`${projectRoot}/expo-env.d.ts`]: '/// <reference types="expo/types" />' });
    answers({ exitCode: 2, stdout: `src/a.ts(1,1): error TS2304: Cannot find name 'nope'.\n` });

    expect((await runTypeCheckAsync(projectRoot)).generatedTypes).toBeNull();
  });

  // The note explains diagnostics. A run with none has nothing to explain, and a line about a file
  // that cost nothing is noise on a green report.
  it(`should say nothing on a run that found no errors`, async () => {
    withExpoTsConfig();
    answers({ exitCode: 0 });

    expect((await runTypeCheckAsync(projectRoot)).generatedTypes).toBeNull();
  });

  it(`should say nothing for a project whose config never names it`, async () => {
    vol.fromJSON({
      [`${projectRoot}/package.json`]: '{}',
      [`${projectRoot}/tsconfig.json`]: '{"include": ["src"]}',
      [`${projectRoot}/node_modules/.bin/tsc`]: '#!/bin/sh',
      [`${projectRoot}/src/app/index.tsx`]: '',
    });
    answers({ exitCode: 2, stdout: `src/a.ts(1,1): error TS2304: Cannot find name 'nope'.\n` });

    expect((await runTypeCheckAsync(projectRoot)).generatedTypes).toBeNull();
  });
});
