const JsonFile = require('@expo/json-file');
const path = require('path');

/**
 * Convert typescript paths to jest module mapping.
 *
 * @param {Record<string, string[]>} paths
 * @return {Record<string, string>}
 */
function jestMappingFromTypescriptPaths(paths) {
  const mapping = {};

  for (const path in paths) {
    if (!paths[path].length) {
      console.warn(`Skipping empty typescript path map: ${path}`);
      continue;
    }

    const jestRegex = convertTypescriptMatchToJestRegex(path);
    const jestTarget = paths[path].map((target) => convertTypescriptTargetToJestTarget(target));

    mapping[jestRegex] = jestTarget.length === 1 ? jestTarget[0] : jestTarget;
  }

  return mapping;
}

/** Convert a typescript match rule key to jest regex */
function convertTypescriptMatchToJestRegex(match) {
  const regex = match
    .split('/')
    .map((segment) =>
      segment.trim() === '*' ? '(.*)' : segment.replace(/[-\\^$*+?.()|[\]{}]/g, '\\$&')
    )
    .join('/');

  return `^${regex}$`;
}

/** Convert a typescript match rule value to jest regex target */
function convertTypescriptTargetToJestTarget(target) {
  const segments = target.split('/').map((segment) => (segment.trim() === '*' ? '$1' : segment));
  return ['<rootDir>', ...segments].join('/');
}

/** Try to add the `moduleNameMapper` configuration from the typescript `paths` configuration. */
function withTypescriptMapping(jestConfig) {
  const readJsonFile = JsonFile.default?.read || JsonFile.read;

  try {
    // The path to tsconfig.json is resolved relative to cwd
    // See: _createTypeScriptConfiguration() in `createJestPreset`
    const tsConfigPath = path.resolve('tsconfig.json');
    const tsconfig = readJsonFile(tsConfigPath, { json5: true });

    jestConfig.moduleNameMapper = {
      ...jestMappingFromTypescriptPaths(tsconfig.compilerOptions.paths || {}),
      ...(jestConfig.moduleNameMapper || {}),
    };
  } catch (error) {
    // If the user is not using typescript, we can safely ignore this error
    if (error.code === 'MODULE_NOT_FOUND') return jestConfig;
    if (error.code === 'ENOENT') return jestConfig;

    console.log(error);

    throw error;
  }

  return jestConfig;
}

module.exports = {
  _jestMappingFromTypescriptPaths: jestMappingFromTypescriptPaths, // Exported for testing
  withTypescriptMapping,
};
