// The four things `runTypeCheckAsync` decides: whether there is anything to check, what the
// compiler is run with, what its diagnostics amount to, and which of its failures are the tool's
// rather than the project's.
import { vol } from 'memfs';

import { spawnSubprocessAsync } from '../../utils/subprocess';
import { resolveTsConfigPath, resolveTypeScriptCli, runTypeCheckAsync, TSC_ARGS } from '../checkAsync';

jest.mock('../../utils/subprocess', () => ({ spawnSubprocessAsync: jest.fn() }));

const spawn = spawnSubprocessAsync as jest.MockedFunction<typeof spawnSubprocessAsync>;
const projectRoot = '/project';

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
      suggestedCommand: 'npx exagent install typescript --dev',
    });
    expect(spawn).not.toHaveBeenCalled();
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
