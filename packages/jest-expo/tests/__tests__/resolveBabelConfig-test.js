const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

const { resolveBabelConfig } = require('../../src/resolveBabelConfig');

function withTempProject(files, callback) {
  const projectRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'jest-expo-babel-'));

  try {
    for (const file of files) {
      fs.writeFileSync(path.join(projectRoot, file), getBabelConfigFixture(file));
    }
    return callback(projectRoot);
  } finally {
    fs.rmSync(projectRoot, { recursive: true, force: true });
  }
}

function getBabelConfigFixture(file) {
  if (file === '.babelrc' || file.endsWith('.json')) {
    return '{}';
  }
  if (file.endsWith('.mjs') || file.endsWith('.mts')) {
    return 'export default {};';
  }
  return 'module.exports = {};';
}

it.each([
  '.babelrc',
  '.babelrc.js',
  '.babelrc.cjs',
  '.babelrc.mjs',
  '.babelrc.json',
  '.babelrc.cts',
  'babel.config.js',
  'babel.config.cjs',
  'babel.config.mjs',
  'babel.config.json',
  'babel.config.cts',
  'babel.config.ts',
  'babel.config.mts',
])('extends the Expo Metro resolved config for %s', (configFileName) => {
  withTempProject([configFileName], (projectRoot) => {
    expect(resolveBabelConfig(projectRoot)).toEqual({
      extends: path.join(projectRoot, configFileName),
    });
  });
});

it('uses the Expo babel preset when the project has no babel config', () => {
  withTempProject([], (projectRoot) => {
    expect(resolveBabelConfig(projectRoot).configFile).toContain('babel-preset');
  });
});

it('resolves configs from the project root, not the current working directory', () => {
  const previousCwd = process.cwd();

  withTempProject(['babel.config.js'], (projectRoot) => {
    withTempProject([], (cwd) => {
      try {
        process.chdir(cwd);
        expect(resolveBabelConfig(projectRoot)).toEqual({
          extends: path.join(projectRoot, 'babel.config.js'),
        });
      } finally {
        process.chdir(previousCwd);
      }
    });
  });
});
