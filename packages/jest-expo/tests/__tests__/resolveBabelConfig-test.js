const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

const { resolveBabelConfig } = require('../../src/resolveBabelConfig');

function withTempProject(files, callback) {
  const projectRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'jest-expo-babel-'));

  try {
    for (const file of files) {
      fs.writeFileSync(path.join(projectRoot, file), 'module.exports = {};');
    }
    return callback(projectRoot);
  } finally {
    fs.rmSync(projectRoot, { recursive: true, force: true });
  }
}

it.each(['babel.config.js', 'babel.config.cjs', 'babel.config.mjs', 'babel.config.json'])(
  'defers to Babel default resolution for %s',
  (configFileName) => {
    withTempProject([configFileName], (projectRoot) => {
      expect(resolveBabelConfig(projectRoot)).toBeNull();
    });
  }
);

it.each(['.babelrc', '.babelrc.js'])(
  'uses the Expo babel preset for directory-scoped %s',
  (configFileName) => {
    withTempProject([configFileName], (projectRoot) => {
      expect(resolveBabelConfig(projectRoot)).toContain('babel-preset');
    });
  }
);

it('resolves configs from the project root, not the current working directory', () => {
  const previousCwd = process.cwd();

  withTempProject(['babel.config.js'], (projectRoot) => {
    withTempProject([], (cwd) => {
      try {
        process.chdir(cwd);
        expect(resolveBabelConfig(projectRoot)).toBeNull();
      } finally {
        process.chdir(previousCwd);
      }
    });
  });
});
