const jsExtensions = ['.cjs', '.mjs', '.js', '.jsx'];
const tsExtensions = ['.ts', '.tsx', '.d.ts'];
const sourceExtensions = [...jsExtensions, ...tsExtensions];

const platformSubextensions = ['.android', '.ios', '.web', '.native'];

function computeExpoExtensions(baseExtensions, platformSubextensions) {
  const expoExtensions = [];
  for (const platform of [...platformSubextensions, '']) {
    for (const base of baseExtensions) {
      expoExtensions.push(`${platform}${base}`);
    }
  }
  return expoExtensions;
}

// Every source extension, with and without a platform suffix: `.ios.tsx`, `.web.js`, `.ts`, ...
const allExtensions = computeExpoExtensions(sourceExtensions, platformSubextensions);

module.exports = {
  jsExtensions,
  tsExtensions,
  sourceExtensions,
  platformSubextensions,
  computeExpoExtensions,
  allExtensions,
};
