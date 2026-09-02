import { vol } from 'memfs';
import path from 'path';

import { CommandError } from '../../utils/errors';
import { assertExpoAppSync, declaresExpoSync, findUpExpoAppRootOrAssert } from '../expoApp';

const projectRoot = path.resolve('/project');

afterEach(() => {
  vol.reset();
});

function writePackageJson(contents: object | string) {
  vol.fromJSON({
    [path.join(projectRoot, 'package.json')]:
      typeof contents === 'string' ? contents : JSON.stringify(contents),
  });
}

describe(declaresExpoSync, () => {
  it(`should be true for a package that declares expo`, () => {
    writePackageJson({ name: 'app', dependencies: { expo: '~54.0.0' } });

    expect(declaresExpoSync(projectRoot)).toBe(true);
  });

  // The rule is *declared*, not installed: a fresh clone with no `node_modules` is the most
  // ordinary state a real project is ever in, and reading the installed package instead would call
  // every one of them "not an Expo app".
  it(`should be true for a project whose dependencies are not installed`, () => {
    writePackageJson({ name: 'app', dependencies: { expo: '~54.0.0' } });

    expect(declaresExpoSync(projectRoot)).toBe(true);
  });

  it(`should be true for expo declared as a dev dependency`, () => {
    writePackageJson({ name: 'app', devDependencies: { expo: '~54.0.0' } });

    expect(declaresExpoSync(projectRoot)).toBe(true);
  });

  it(`should be false for a plain Node package`, () => {
    writePackageJson({ name: 'plain', version: '1.0.0' });

    expect(declaresExpoSync(projectRoot)).toBe(false);
  });

  // A guard, not a diagnosis: nothing in an unreadable file declares `expo`, and the command that
  // is about to be stopped has a better error to print than a JSON parse failure.
  it(`should be false for a malformed or missing package.json`, () => {
    writePackageJson('{ not json');
    expect(declaresExpoSync(projectRoot)).toBe(false);

    vol.reset();
    expect(declaresExpoSync(projectRoot)).toBe(false);
  });
});

describe(assertExpoAppSync, () => {
  it(`should pass for an Expo app`, () => {
    writePackageJson({ name: 'app', dependencies: { expo: '~54.0.0' } });

    expect(() => assertExpoAppSync(projectRoot)).not.toThrow();
  });

  it(`should stop with what, why and how, and a command on the Try line`, () => {
    writePackageJson({ name: 'plain', version: '1.0.0' });

    let thrown: CommandError | null = null;
    try {
      assertExpoAppSync(projectRoot);
    } catch (error) {
      thrown = error as CommandError;
    }

    expect(thrown?.code).toBe('NOT_EXPO_APP');
    expect(thrown?.message).toContain('is not an Expo app');
    expect(thrown?.message).toContain('Why:');
    expect(thrown?.message).toContain('How:');
    expect(thrown?.suggestedCommand).toBe('npx @expo/agent-cli new my-app');
    // The `Try:` line is the recovery that changes nothing that is already here. Adding Expo to
    // this package is the mutation this guard exists to prevent, so it stays in the prose.
    expect(thrown?.message).toContain('npx @expo/agent-cli install expo');
  });

  // The default band, exactly as `NO_PROJECT`: the tool did not work, and running it again
  // unchanged does the same thing.
  it(`should leave the exit code unset, which is the tool-error band`, () => {
    writePackageJson({ name: 'plain', version: '1.0.0' });

    expect(() => assertExpoAppSync(projectRoot)).toThrow();
    try {
      assertExpoAppSync(projectRoot);
    } catch (error) {
      expect((error as CommandError).exitCode).toBeUndefined();
    }
  });
});

describe(findUpExpoAppRootOrAssert, () => {
  it(`should answer the app root for a directory inside an Expo app`, () => {
    vol.fromJSON({
      [path.join(projectRoot, 'package.json')]: JSON.stringify({
        name: 'app',
        dependencies: { expo: '~54.0.0' },
      }),
      [path.join(projectRoot, 'src', 'components', 'Button.tsx')]: '',
    });

    expect(findUpExpoAppRootOrAssert(path.join(projectRoot, 'src', 'components'))).toBe(
      projectRoot
    );
  });

  // The two failures are told apart: "there is no project here" and "the project here is not an
  // app" are different mistakes with different recoveries.
  it(`should say NO_PROJECT when the walk finds nothing at all`, () => {
    vol.fromJSON({ [path.join(path.resolve('/nowhere'), 'readme.md')]: '' });

    expect(() => findUpExpoAppRootOrAssert(path.resolve('/nowhere'))).toThrow(
      expect.objectContaining({ code: 'NO_PROJECT' })
    );
  });

  it(`should say NOT_EXPO_APP when the walk finds a package that is not an app`, () => {
    writePackageJson({ name: 'plain', version: '1.0.0' });

    expect(() => findUpExpoAppRootOrAssert(projectRoot)).toThrow(
      expect.objectContaining({ code: 'NOT_EXPO_APP' })
    );
  });
});
