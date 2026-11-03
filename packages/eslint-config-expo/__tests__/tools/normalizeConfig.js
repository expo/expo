const SEVERITIES = { 0: 'off', 1: 'warn', 2: 'error', off: 'off', warn: 'warn', error: 'error' };
const GLOBAL_KINDS = {
  false: 'readonly',
  readonly: 'readonly',
  readable: 'readonly',
  true: 'writable',
  writable: 'writable',
  writeable: 'writable',
  off: 'off',
};

function sortKeys(object) {
  return Object.fromEntries(Object.entries(object).sort(([a], [b]) => a.localeCompare(b)));
}

function normalizeRules(rules) {
  const enabled = {};
  for (const [name, entry] of Object.entries(rules ?? {})) {
    const [severity, ...options] = Array.isArray(entry) ? entry : [entry];
    if (SEVERITIES[severity] === 'off') {
      continue;
    }
    enabled[name] = [SEVERITIES[severity], ...options];
  }
  return sortKeys(enabled);
}

function normalizeGlobals(globals) {
  const normalized = {};
  for (const [name, kind] of Object.entries(globals ?? {})) {
    normalized[name] = GLOBAL_KINDS[kind];
  }
  return sortKeys(normalized);
}

// The default parser is `null` in ESLint 8 and an `espree` object without `meta` in ESLint 9.
function normalizeParser(parser) {
  const name = typeof parser === 'string' ? parser : parser?.meta?.name;
  if (!name) {
    return null;
  }
  return name.includes('typescript-eslint/parser') ? '@typescript-eslint/parser' : name;
}

/**
 * Reduces the result of `ESLint#calculateConfigForFile` from either ESLint 8 (eslintrc) or
 * ESLint 9 (flat) to the parts a user observes, in one shape, so the two entry points can be
 * snapshotted and compared. Rules at `off` are dropped: they only matter when something else
 * turns the rule on.
 */
function normalizeConfig(config) {
  const isFlat = 'languageOptions' in config;
  const languageOptions = isFlat ? config.languageOptions : (config.parserOptions ?? {});
  const parserOptions = isFlat
    ? (languageOptions.parserOptions ?? {})
    : (config.parserOptions ?? {});
  return {
    parser: normalizeParser(isFlat ? languageOptions.parser : config.parser),
    ecmaVersion: languageOptions.ecmaVersion ?? null,
    sourceType: languageOptions.sourceType ?? null,
    ecmaFeatures: parserOptions.ecmaFeatures ?? {},
    env: isFlat ? undefined : sortKeys(config.env ?? {}),
    globals: normalizeGlobals(isFlat ? languageOptions.globals : config.globals),
    plugins: (isFlat ? Object.keys(config.plugins) : config.plugins)
      .filter((p) => p !== '@')
      .sort(),
    rules: normalizeRules(config.rules),
    settings: sortKeys(config.settings ?? {}),
  };
}

module.exports = { normalizeConfig };
