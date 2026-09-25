import { getPlatformsFromConfig } from '../Config';

jest.mock('@expo/config-plugins', () => ({ withPlugins: jest.fn((config) => config) }));

/** What the project depends on, and what only a NODE_PATH lookup would find. */
const PROJECT_PACKAGES = ['react-native'];
const HOISTED_ONLY_PACKAGES = ['react-dom', 'react-native-tvos', 'react-native-macos'];

// Stands in for the real `resolveFrom`, which has two ways to find a package: the project's own
// node_modules, and a fallback through Node that reads NODE_PATH. `skipNodePath` turns the fallback
// off, so the hoisted packages below are only visible without it. That is the whole difference
// under test, so the mock models just those two lookups.
jest.mock('@expo/require-utils', () => ({
  resolveFrom: jest.fn(
    (fromDirectory: string, moduleId: string, params?: { skipNodePath?: boolean }) => {
      const name = moduleId.replace(/\/package\.json$/, '');
      if (PROJECT_PACKAGES.includes(name)) {
        return `${fromDirectory}/node_modules/${name}/package.json`;
      }
      if (!params?.skipNodePath && HOISTED_ONLY_PACKAGES.includes(name)) {
        return `/hoisted/${name}/package.json`;
      }
      return null;
    }
  ),
}));

describe(getPlatformsFromConfig, () => {
  it(`detects the platforms the project depends on`, () => {
    expect(getPlatformsFromConfig('/project', {})).toEqual(['ios', 'android']);
  });

  // Otherwise detection asks "is this package anywhere in the workspace" instead of "does this
  // project depend on it", and the answer changes with whichever bin started the process.
  it(`ignores packages the project does not depend on, however they are reachable`, () => {
    expect(getPlatformsFromConfig('/project', {})).not.toContain('web');
  });

  it(`ignores hoisted out-of-tree platforms too`, () => {
    const exp = { experiments: { outOfTreePlatforms: true } };
    expect(getPlatformsFromConfig('/project', exp)).toEqual(['ios', 'android']);
  });

  it(`still honours platforms declared in the config`, () => {
    expect(getPlatformsFromConfig('/project', { platforms: ['web'] })).toEqual(['web']);
  });
});
