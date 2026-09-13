const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

const { resolveProjectRoot } = require('../resolveProjectRoot');

describe(`resolveProjectRoot`, () => {
  let monorepoRoot;
  let projectRoot;

  beforeEach(() => {
    monorepoRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'expo-constants-monorepo-test-'));
    projectRoot = path.join(monorepoRoot, 'apps', 'example');
    fs.mkdirSync(path.join(projectRoot, 'android'), { recursive: true });
    fs.writeFileSync(path.join(projectRoot, 'package.json'), '{}');
  });

  afterEach(() => {
    fs.rmSync(monorepoRoot, { recursive: true, force: true });
  });

  it(`accepts the app directory`, () => {
    expect(resolveProjectRoot(projectRoot)).toBe(projectRoot);
  });

  it(`resolves an Android native directory to its app in a monorepo`, () => {
    expect(resolveProjectRoot(path.join(projectRoot, 'android'))).toBe(projectRoot);
  });

  it(`rejects a directory outside an Expo app`, () => {
    const unrelatedDirectory = path.join(monorepoRoot, 'unrelated', 'android');
    fs.mkdirSync(unrelatedDirectory, { recursive: true });

    expect(() => resolveProjectRoot(unrelatedDirectory)).toThrow(/Unable to locate project/);
  });
});
