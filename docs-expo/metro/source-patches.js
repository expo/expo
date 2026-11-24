const path = require('node:path');

const docsRoot = path.resolve(__dirname, '../../docs');

function replaceAll(source, file, pattern, replacement) {
  if (!pattern.test(source)) {
    throw new Error(
      `The source patch for "${file}" did not match ${pattern}. The file changed. Update docs-expo/metro/source-patches.js.`
    );
  }
  return source.replace(pattern, replacement);
}

// Each patch changes source in `../docs` that Metro cannot bundle. The files in `../docs`
// stay unchanged, because the Next.js build uses them.
const PATCHES = {
  // Metro does not support top-level `await`. The Prism language files register
  // themselves on the global `Prism` object, so a synchronous `require` gives the same result.
  'common/code-utilities.ts': source => {
    const file = 'common/code-utilities.ts';
    let result = replaceAll(
      source,
      file,
      /async function initPrismAsync\(\)/,
      'function initPrismAsync()'
    );
    result = replaceAll(result, file, /await import\(/g, 'require(');
    return replaceAll(result, file, /^await initPrismAsync\(\);$/m, 'initPrismAsync();');
  },
  // Metro cannot resolve a `require` call with a template string. Webpack makes a context
  // module from it. `require.context` is the Metro API for the same result.
  'ui/components/PageHeader/PagePackageVersion.tsx': source =>
    replaceAll(
      source,
      'ui/components/PageHeader/PagePackageVersion.tsx',
      /: require\(\s*`~\/public\/static\/schemas\/\$\{([^`]+)\}\/native-modules\.json`\s*\)/,
      (_match, version) =>
        `: require.context('../../../public/static/schemas', true, /\\/native-modules\\.json$/)(\`./\${${version}}/native-modules.json\`)`
    ),
};

function applySourcePatch(filename, source) {
  const relativePath = path.relative(docsRoot, filename).split(path.sep).join('/');
  const patch = PATCHES[relativePath];
  return patch ? patch(source) : source;
}

module.exports = { applySourcePatch };
