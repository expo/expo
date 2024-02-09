const JsonFile = require('@expo/json-file');
const path = require('path');

/**
 * Convert typescript paths to jest module mapping.
 *
 * @param {Record<string, string[]>} paths
 * @param {string} [prefix="<rootDir>"]
 * @return {Record<string, string>}
 */
function jestMappingFromTypescriptPaths(paths, prefix = '<rootDir>') {
  const mapping = {};

  for (const path in paths) {
    if (!paths[path].length) {
      console.warn(`Skipping empty typescript path map: ${path}`);
      continue;
    }

    const jestRegex = convertTypescriptMatchToJestRegex(path);
    const jestTarget = paths[path].map((target) =>
      convertTypescriptTargetToJestTarget(target, prefix)
    );

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
function convertTypescriptTargetToJestTarget(target, prefix = '<rootDir>') {
  const segments = target.split('/').map((segment) => (segment.trim() === '*' ? '$1' : segment));
  return [prefix, ...segments].join('/');
}

function mutateJestMappingFromConfig(jestConfig, configFile) {
  const readJsonFile = JsonFile.default?.read || JsonFile.read;

  try {
    // The path to jsconfig.json or tsconfig.json is resolved relative to cwd
    // See: _createTypeScriptConfiguration() in `createJestPreset`
    const configPath = path.resolve(configFile);
    const config = readJsonFile(configPath, { json5: true });
    let pathPrefix = '<rootDir>';

    if (config?.compilerOptions?.baseUrl) {
      pathPrefix = path.join(pathPrefix, config.compilerOptions.baseUrl);
    }

    if (config?.compilerOptions?.paths) {
      jestConfig.moduleNameMapper = {
        ...jestMappingFromTypescriptPaths(config.compilerOptions.paths || {}, pathPrefix),
        ...(jestConfig.moduleNameMapper || {}),
      };
    }

    return true;
  } catch (error) {
    // If the user is not using typescript, we can safely ignore this error
    if (error.code === 'MODULE_NOT_FOUND' || error.code === 'ENOENT') {
      return undefined;
    }

    // Other errors are unexpected, but should not block the jest configuration
    return false;
  }
}

/** Try to add the `moduleNameMapper` configuration from the typescript `paths` configuration. */
function withTypescriptMapping(jestConfig) {
  const fromTsConfig = mutateJestMappingFromConfig(jestConfig, 'tsconfig.json');
  const fromJsConfig = !fromTsConfig
    ? mutateJestMappingFromConfig(jestConfig, 'jsconfig.json')
    : undefined;

  if (fromTsConfig === false || fromJsConfig === false) {
    console.warn('Failed to set custom typescript paths for jest.');
    console.warn('You need to configure jest moduleNameMapper manually.');
    console.warn(
      'See: https://jestjs.io/docs/configuration#modulenamemapper-objectstring-string--arraystring'
    );
  }

  return jestConfig;
}

module.exports = {
  _jestMappingFromTypescriptPaths: jestMappingFromTypescriptPaths, // Exported for testing
  withTypescriptMapping,
};
