'use strict';

const fs = require('fs-extra');
const glob = require('glob-promise');
const escapeRegExp = require('lodash.escaperegexp');
const nullthrows = require('nullthrows').default;
const path = require('path');
const shell = require('shelljs');

const reactAndroidPath = path.resolve(__dirname, '../../android/ReactAndroid');

exports.namespaceExpolibImportsAsync = async function namespaceExpolibImportsAsync(
  rulesFile = 'okhttpjarjar.txt'
) {
  let filePaths = await glob(`${reactAndroidPath}/**/*.java`);
  const rules = await _readJarJarRulesAsync(rulesFile);

  const rewriteImports = _getImportRewriteFunction(rules);

  await Promise.all(
    filePaths.map(async filePath => {
      let sourceCode = await fs.readFile(filePath, 'utf8');
      let modifiedCode = rewriteImports(sourceCode);
      if (modifiedCode !== sourceCode) {
        await fs.writeFile(filePath, modifiedCode);
      }
    })
  );
};

async function _readJarJarRulesAsync(rulesDefaultFile = 'okhttpjarjar.txt') {
  let rulesFile = await fs.readFile(path.resolve(__dirname, 'okhttpjarjar.txt'), 'utf8');
  const rules = rulesFile
    .split('\n')
    .filter(line => line.trim())
    .map(_parseJarJarRule)
    .filter(rule => rule.type === 'rule');
  return rules;
}

function _parseJarJarRule(line) {
  let [type, ...parts] = line.trim().split(/\s+/);
  if (type === 'rule') {
    return { type, match: nullthrows(parts[0]), replace: nullthrows(parts[1]) };
  } else if (type === 'zap' || type === 'keep') {
    return { type, match: nullthrows(parts[0]) };
  }
  throw new Error(`Unknown Jar Jar rule: ${line}`);
}

function _getImportRewriteFunction(rules) {
  const patternsList = [];
  for (let rule of rules) {
    let { matchPattern, replacePattern } = _createPackageRewritePatterns(rule);
    let matchImportRegex = new RegExp(`^import ${matchPattern}`, 'gm');
    let replaceImportPattern = `import ${replacePattern}`;
    patternsList.push({ matchImportRegex, replaceImportPattern });
  }

  return code => {
    for (let patterns of patternsList) {
      let { matchImportRegex, replaceImportPattern } = patterns;
      matchImportRegex.lastIndex = 0;
      code = code.replace(matchImportRegex, replaceImportPattern);
    }
    return code;
  };
}

/**
 * Converts Jar Jar rules to patterns that can be used to create a regex and
 * a replacement template for String::replace.
 */
function _createPackageRewritePatterns(rule) {
  let javaIdentifierPattern = '[a-zA-Z_$][a-zA-Z0-9_$]*';
  let matchPattern = rule.match.replace(/(\*\*|.)/g, token => {
    switch (token) {
      case '*':
        return `(${javaIdentifierPattern})`;
      case '**':
        return `(${javaIdentifierPattern}(?:\.${javaIdentifierPattern})*)`;
      default:
        return escapeRegExp(token);
    }
  });

  let replacePattern = rule.replace
    .replace('$', '$$')
    .replace(/@(\d+)/, (_, index) => (index === 0 ? '$&' : `$${index}`));

  return { matchPattern, replacePattern };
}

exports.namespaceExpolibGradleDependenciesAsync = async function namespaceExpolibGradleDependenciesAsync() {
  let reactAndroidGradlePath = path.join(reactAndroidPath, 'build.gradle');
  let gradleFile = await fs.readFile(reactAndroidGradlePath, 'utf8');

  gradleFile = _rewriteGradleDependencies(gradleFile);
  gradleFile = _addGradleRepositoriesSection(gradleFile);

  await fs.writeFile(reactAndroidGradlePath, gradleFile);
};

function _rewriteGradleDependencies(gradleFile) {
  // TODO: Use a more generalizable and robust approach to editing the Gradle
  // dependencies
  gradleFile = gradleFile.replace(
    /(compile\s+['"])(com\.squareup\.(?:okhttp3|okio):.+:.+['"])/g,
    '$1expolib_v1.$2'
  );

  gradleFile = gradleFile.replace(
    /compile 'com\.facebook\.fresco:imagepipeline-okhttp3:(.+)'/,
    `compile 'expolib_v1.com.facebook.fresco:expolib_v1-imagepipeline-okhttp3:$1'
    $&`
  );

  return gradleFile;
}

function _addGradleRepositoriesSection(gradleFile) {
  const expolibGradleFilename = 'expolib-build.gradle';
  shell.cp(
    path.resolve(__dirname, expolibGradleFilename),
    path.resolve(__dirname, '../../android/ReactAndroid')
  );

  if (!gradleFile.endsWith('\n')) {
    gradleFile += '\n';
  }
  gradleFile += `apply from: '${expolibGradleFilename}'\n`;
  return gradleFile;
}
