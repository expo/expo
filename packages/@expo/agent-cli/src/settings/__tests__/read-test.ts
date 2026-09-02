/* eslint-env jest */
// @ref llp/0015-backend-selection-and-config.rfc.md §Where the config lives
// The one read: `package.json` › `expo` › `@expo/agent-cli`, and what happens when it is not there.
import { vol } from 'memfs';

import { readAgentCliSettings, resetSettingsCache, CONFIG_KEY_PATH } from '../read';
import { EMPTY_SETTINGS } from '../types';

const projectRoot = '/project';

beforeEach(() => {
  resetSettingsCache();
  vol.mkdirSync(projectRoot, { recursive: true });
});

afterEach(() => {
  vol.reset();
});

function writePackageJson(contents: unknown): void {
  vol.writeFileSync(
    `${projectRoot}/package.json`,
    typeof contents === 'string' ? contents : JSON.stringify(contents, null, 2)
  );
}

describe('a project that configures nothing', () => {
  it(`has no settings and no file, which is not an error`, () => {
    writePackageJson({ name: 'app' });
    expect(readAgentCliSettings(projectRoot)).toEqual({
      settings: EMPTY_SETTINGS,
      file: null,
      keyPath: null,
    });
  });

  it(`is the answer for a project with no package.json at all`, () => {
    expect(readAgentCliSettings(projectRoot).settings).toEqual(EMPTY_SETTINGS);
  });

  it(`is the answer for an "expo" key that is not an object`, () => {
    writePackageJson({ name: 'app', expo: 'yes' });
    expect(readAgentCliSettings(projectRoot).settings).toEqual(EMPTY_SETTINGS);
  });
});

describe('a project that configures something', () => {
  it(`reads it, and says where it came from`, () => {
    writePackageJson({ name: 'app', expo: { agentCli: { buildBackend: 'eas' } } });
    const loaded = readAgentCliSettings(projectRoot);
    expect(loaded.settings.buildBackend).toBe('eas');
    expect(loaded.file).toBe(`${projectRoot}/package.json`);
    expect(loaded.keyPath).toBe(CONFIG_KEY_PATH);
  });

  it(`sits beside the other expo tooling keys without disturbing them`, () => {
    writePackageJson({
      name: 'app',
      expo: {
        install: { exclude: ['react-native'] },
        doctor: { reactNativeDirectoryCheck: { enabled: false } },
        agentCli: { target: 'dev-build' },
      },
    });
    expect(readAgentCliSettings(projectRoot).settings.target).toBe('dev-build');
  });

  it(`refuses an invalid value, naming the location`, () => {
    writePackageJson({ name: 'app', expo: { agentCli: { buildBackend: 'cloud' } } });
    expect(() => readAgentCliSettings(projectRoot)).toThrow(/"expo.agentCli" in package.json/);
  });
});

describe('a package.json that cannot be parsed', () => {
  it(`is refused rather than treated as configuring nothing`, () => {
    writePackageJson('{ "name": "app", }');
    expect(() => readAgentCliSettings(projectRoot)).toThrow(/is not valid JSON/);
  });
});

describe('caching', () => {
  it(`reads the file once per project per process`, () => {
    writePackageJson({ name: 'app', expo: { agentCli: { buildBackend: 'eas' } } });
    expect(readAgentCliSettings(projectRoot).settings.buildBackend).toBe('eas');

    // Edited behind the CLI's back: nothing changes a project's preferences mid-command, so the
    // second read is the first one's answer.
    writePackageJson({ name: 'app', expo: { agentCli: { buildBackend: 'local' } } });
    expect(readAgentCliSettings(projectRoot).settings.buildBackend).toBe('eas');

    resetSettingsCache();
    expect(readAgentCliSettings(projectRoot).settings.buildBackend).toBe('local');
  });
});
