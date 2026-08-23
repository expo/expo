import { vol } from 'memfs';
import path from 'path';

import { resolveEasCliOrThrow } from '../easCli';
import { CommandError } from '../errors';

const projectRoot = '/project';
const realPlatform = process.platform;

function mockPlatform(value: typeof process.platform) {
  Object.defineProperty(process, 'platform', { value });
}

beforeEach(() => {
  // A fixed platform for every test but the Windows one: the resolver picks the bin *name* from
  // it, so the tests would otherwise install a bin the resolver on Windows never looks for.
  mockPlatform('darwin');
});

afterEach(() => {
  mockPlatform(realPlatform);
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

  it(`should prefer the .cmd shim of the project on Windows`, () => {
    mockPlatform('win32');
    vol.fromJSON({ [`${projectRoot}/node_modules/.bin/eas.cmd`]: '' });

    expect(resolveEasCliOrThrow(projectRoot, { pathEnv: '/usr/local/bin' })).toEqual({
      command: path.join(projectRoot, 'node_modules', '.bin', 'eas.cmd'),
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
