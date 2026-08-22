import { vol } from 'memfs';
import path from 'path';

import { CommandError } from '../../utils/errors';
import { assertEasConfiguredOrThrow, resolveEasCliOrThrow } from '../easCli';

const projectRoot = '/project';

afterEach(() => {
  vol.reset();
});

describe(resolveEasCliOrThrow, () => {
  it(`should prefer the eas-cli installed in the project`, () => {
    vol.fromJSON({
      [`${projectRoot}/node_modules/.bin/eas`]: '#!/bin/sh',
      '/usr/local/bin/eas': '#!/bin/sh',
    });

    expect(resolveEasCliOrThrow(projectRoot, { pathEnv: '/usr/local/bin' })).toEqual({
      command: path.join(projectRoot, 'node_modules', '.bin', 'eas'),
      source: 'project',
    });
  });

  it(`should fall back to the eas on PATH`, () => {
    vol.fromJSON({ '/usr/local/bin/eas': '#!/bin/sh' });

    expect(resolveEasCliOrThrow(projectRoot, { pathEnv: '/usr/local/bin' })).toEqual({
      command: path.join('/usr/local/bin', 'eas'),
      source: 'path',
    });
  });

  it(`should throw a prompt the agent can act on when eas-cli is missing`, () => {
    // Errors are prompts (llp/0006): the install command is the whole recovery path.
    expect.assertions(3);
    try {
      resolveEasCliOrThrow(projectRoot, { pathEnv: '/usr/local/bin' });
    } catch (error: any) {
      expect(error).toBeInstanceOf(CommandError);
      expect(error.code).toBe('EAS_CLI_MISSING');
      expect(error.suggestedCommand).toBe('npm install -g eas-cli');
    }
  });
});

describe(assertEasConfiguredOrThrow, () => {
  it(`should pass for a project with an eas.json`, () => {
    vol.fromJSON({ [`${projectRoot}/eas.json`]: '{"build":{}}' });

    expect(() => assertEasConfiguredOrThrow(projectRoot)).not.toThrow();
  });

  it(`should throw the configure command when eas.json is missing`, () => {
    expect.assertions(2);
    try {
      assertEasConfiguredOrThrow(projectRoot);
    } catch (error: any) {
      expect(error.code).toBe('EAS_NOT_CONFIGURED');
      expect(error.suggestedCommand).toBe('npx eas-cli build:configure');
    }
  });
});
