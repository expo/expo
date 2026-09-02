import { vol } from 'memfs';

import { isFileIgnoredAsync } from '../../utils/files';
import { EnvLocalFilesCheck } from '../EnvLocalFilesCheck';

jest.mock('fs');
jest.mock('../../utils/files');

const projectRoot = '/tmp/project';

const additionalProjectProps = {
  exp: { name: 'name', slug: 'slug' },
  projectRoot,
  hasUnusedStaticConfig: false,
  staticConfigPath: null,
  dynamicConfigPath: null,
};

const mockIsFileIgnored = (value: boolean | null) =>
  (isFileIgnoredAsync as jest.MockedFunction<typeof isFileIgnoredAsync>).mockResolvedValue(value);

describe('runAsync', () => {
  afterEach(() => {
    vol.reset();
    jest.resetAllMocks();
  });

  it('returns isSuccessful = true when no .local env files exist', async () => {
    vol.fromJSON({ [`${projectRoot}/package.json`]: '{}' });
    mockIsFileIgnored(false);

    const result = await new EnvLocalFilesCheck().runAsync({
      pkg: { name: 'name', version: '1.0.0' },
      ...additionalProjectProps,
    });

    expect(result.isSuccessful).toBe(true);
    expect(isFileIgnoredAsync).not.toHaveBeenCalled();
  });

  it('returns isSuccessful = true when a .local env file exists and is gitignored', async () => {
    vol.fromJSON({ [`${projectRoot}/.env.local`]: 'FOO=bar' });
    mockIsFileIgnored(true);

    const result = await new EnvLocalFilesCheck().runAsync({
      pkg: { name: 'name', version: '1.0.0' },
      ...additionalProjectProps,
    });

    expect(result.isSuccessful).toBe(true);
  });

  it('returns isSuccessful = true when the ignore status is undetermined (no git)', async () => {
    vol.fromJSON({ [`${projectRoot}/.env.local`]: 'FOO=bar' });
    mockIsFileIgnored(null);

    const result = await new EnvLocalFilesCheck().runAsync({
      pkg: { name: 'name', version: '1.0.0' },
      ...additionalProjectProps,
    });

    expect(result.isSuccessful).toBe(true);
  });

  it('returns isSuccessful = false when a .local env file exists and is not gitignored', async () => {
    vol.fromJSON({ [`${projectRoot}/.env.local`]: 'FOO=bar' });
    mockIsFileIgnored(false);

    const result = await new EnvLocalFilesCheck().runAsync({
      pkg: { name: 'name', version: '1.0.0' },
      ...additionalProjectProps,
    });

    expect(result.isSuccessful).toBe(false);
    expect(result.issues[0]).toContain('.env.local');
    expect(result.issues[0]).toContain('not ignored by Git');
    expect(result.advice[0]).toContain('git rm --cached .env.local');
    expect(result.advice[0]).toContain('.env*.local');
  });

  it('flags every unignored .local variant', async () => {
    vol.fromJSON({
      [`${projectRoot}/.env.local`]: 'FOO=bar',
      [`${projectRoot}/.env.development.local`]: 'FOO=dev',
      [`${projectRoot}/.env.production.local`]: 'FOO=prod',
      [`${projectRoot}/.env.test.local`]: 'FOO=test',
    });
    mockIsFileIgnored(false);

    const result = await new EnvLocalFilesCheck().runAsync({
      pkg: { name: 'name', version: '1.0.0' },
      ...additionalProjectProps,
    });

    expect(result.isSuccessful).toBe(false);
    for (const file of [
      '.env.local',
      '.env.development.local',
      '.env.production.local',
      '.env.test.local',
    ]) {
      expect(result.issues[0]).toContain(file);
    }
  });
});
