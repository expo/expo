/* oxlint-disable no-console */
/**
 * Shows which ESLint rules have oxlint equivalents and their migration status.
 * Compares your actual ESLint rules against oxlint capabilities.
 *
 * Run with: node --experimental-strip-types scripts/oxlint-migration-status.ts
 */

import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const GITHUB_RAW_URL =
  'https://raw.githubusercontent.com/oxc-project/eslint-plugin-oxlint/main/src/generated/rules-by-scope.ts';

// Map from eslint-plugin-oxlint variable names to ESLint plugin prefixes
const SCOPE_TO_PLUGIN: Record<string, string> = {
  eslintRules: 'eslint',
  typescriptRules: '@typescript-eslint',
  typescriptTypeAwareRules: '@typescript-eslint',
  unicornRules: 'unicorn',
  reactRules: 'react',
  reactHooksRules: 'react-hooks',
  nextjsRules: '@next/next',
  importRules: 'import',
  jestRules: 'jest',
  vitestRules: 'vitest',
  jsxA11yRules: 'jsx-a11y',
  jsdocRules: 'jsdoc',
  promiseRules: 'promise',
  nodeRules: 'n',
  reactPerfRules: 'react-perf',
  vueRules: 'vue',
};

// Map from oxlint rule prefix to ESLint plugin prefix
const OXLINT_TO_ESLINT_PLUGIN: Record<string, string> = {
  typescript: '@typescript-eslint',
  'react-hooks': 'react-hooks',
  react: 'react',
  unicorn: 'unicorn',
  nextjs: '@next/next',
  import: 'import',
  jest: 'jest',
  vitest: 'vitest',
  'jsx-a11y': 'jsx-a11y',
  jsdoc: 'jsdoc',
  promise: 'promise',
  n: 'n',
  node: 'n',
  'react-perf': 'react-perf',
};

async function fetchOxlintSupportedRulesAsync(): Promise<Set<string>> {
  const response = await fetch(GITHUB_RAW_URL);
  if (!response.ok) {
    throw new Error(`Failed to fetch rules: ${response.status}`);
  }
  const content = await response.text();

  const result = new Set<string>();

  // Parse each rules object from the TypeScript file
  // Match: const xxxRules: Record<string, 'off'> = { ... };
  const ruleBlockRegex = /const (\w+): Record<string, 'off'> = {([\S\s]*?)};/g;
  let match;

  while ((match = ruleBlockRegex.exec(content)) !== null) {
    const varName = match[1];
    const rulesBlock = match[2];
    const plugin = SCOPE_TO_PLUGIN[varName];

    if (!plugin) {
      continue;
    }

    // Extract rule names from the block (handles both quoted and unquoted keys)
    const ruleRegex = /(?:'([^']+)'|([A-Za-z][A-Za-z-]*)):\s*'off'/g;
    let ruleMatch;

    while ((ruleMatch = ruleRegex.exec(rulesBlock)) !== null) {
      result.add(ruleMatch[1] ?? ruleMatch[2]);
    }
  }

  return result;
}

type RuleConfig = unknown;

type OxlintConfig = {
  rules: Record<string, RuleConfig>;
  overrides?: { rules: Record<string, RuleConfig> }[];
};

function loadOxlintConfig(): OxlintConfig {
  const configPath = resolve(process.cwd(), '.oxlintrc.json');
  const content = readFileSync(configPath, 'utf-8');
  // Remove comments and fix trailing commas (oxlint config allows them, JSON doesn't)
  const withoutComments = content.replace(/\/\/.*$/gm, '').replace(/,\s*([\]}])/g, '$1');
  return JSON.parse(withoutComments);
}

function oxlintRuleToEslintRule(rule: string): string {
  for (const [oxlintPrefix, eslintPrefix] of Object.entries(OXLINT_TO_ESLINT_PLUGIN)) {
    if (rule.startsWith(`${oxlintPrefix}/`)) {
      return `${eslintPrefix}/${rule.slice(oxlintPrefix.length + 1)}`;
    }
  }
  if (!rule.includes('/')) {
    return rule;
  }
  return rule;
}

/**
 * Load ESLint rules from our eslint.config.mjs by dynamically importing it.
 * Collects rules from all config objects in the flat config array.
 */
async function loadEslintRulesAsync(): Promise<Map<string, RuleConfig>> {
  const configPath = resolve(process.cwd(), 'eslint.config.mjs');
  const configModule = await import(configPath);
  const configs = configModule.default;

  const rules = new Map<string, RuleConfig>();

  // Flat config is an array of config objects, each may have a `rules` property
  if (Array.isArray(configs)) {
    for (const config of configs) {
      if (config?.rules) {
        for (const [rule, value] of Object.entries(config.rules as Record<string, RuleConfig>)) {
          rules.set(rule, value);
        }
      }
    }
  }

  return rules;
}

function isRuleEnabled(config: RuleConfig): boolean {
  if (config === 'off' || config === 0) {
    return false;
  }
  if (Array.isArray(config) && (config[0] === 'off' || config[0] === 0)) {
    return false;
  }
  return true;
}

function formatPercent(num: number, total: number): string {
  if (total === 0) {
    return '0%';
  }
  return `${Math.round((num / total) * 100)}%`;
}

function printProgressBar(current: number, total: number, width = 25): string {
  const percent = total === 0 ? 0 : current / total;
  const filled = Math.round(width * percent);
  const empty = width - filled;
  return `[${'█'.repeat(filled)}${'░'.repeat(empty)}] ${formatPercent(current, total)}`;
}

async function mainAsync() {
  console.log('Fetching oxlint supported rules from GitHub...\n');
  const oxlintSupportedRules = await fetchOxlintSupportedRulesAsync();
  const oxlintConfig = loadOxlintConfig();
  const eslintRules = await loadEslintRulesAsync();

  // Build set of rules enabled in oxlint (from top-level rules + overrides)
  const rulesEnabledInOxlint = new Set<string>();
  const rulesDisabledInOxlint = new Set<string>();

  function processOxlintRules(rules: Record<string, RuleConfig>) {
    for (const [rule, status] of Object.entries(rules)) {
      const eslintRule = oxlintRuleToEslintRule(rule);
      const severity = Array.isArray(status) ? status[0] : status;
      if (severity === 'off') {
        rulesDisabledInOxlint.add(eslintRule);
      } else {
        rulesEnabledInOxlint.add(eslintRule);
      }
    }
  }

  processOxlintRules(oxlintConfig.rules);
  if (oxlintConfig.overrides) {
    for (const override of oxlintConfig.overrides) {
      if (override.rules) {
        processOxlintRules(override.rules);
      }
    }
  }

  // Categorize rules.
  // "Migrated" means: enabled in oxlint (regardless of ESLint state, since we set
  // migrated rules to 'off' in ESLint rather than using eslint-plugin-oxlint).
  const migratedToOxlint: string[] = [];
  const couldMigrate: string[] = [];
  const eslintOnly: string[] = [];
  const disabledRules: string[] = [];

  // First, count all rules enabled in oxlint as migrated
  for (const rule of rulesEnabledInOxlint) {
    migratedToOxlint.push(rule);
  }

  // Then categorize ESLint rules (skipping ones already counted as migrated)
  for (const [rule, config] of eslintRules) {
    if (rulesEnabledInOxlint.has(rule)) {
      continue; // already counted as migrated
    }

    if (!isRuleEnabled(config)) {
      disabledRules.push(rule);
      continue;
    }

    if (oxlintSupportedRules.has(rule)) {
      couldMigrate.push(rule);
    } else {
      eslintOnly.push(rule);
    }
  }

  // Sort all arrays
  migratedToOxlint.sort();
  couldMigrate.sort();
  eslintOnly.sort();
  disabledRules.sort();

  const totalEnabled = migratedToOxlint.length + couldMigrate.length + eslintOnly.length;
  const migratable = migratedToOxlint.length + couldMigrate.length;

  const W = 55; // inner width between box borders
  const ESC = String.fromCharCode(0x1b);
  const ansiPattern = new RegExp(ESC + '\\[[\\d;]*m', 'g');
  const visualLen = (s: string) => s.replace(ansiPattern, '').length;
  const line = (content: string) => {
    const pad = W - visualLen(content);
    return `\x1b[1m|\x1b[0m${content}${' '.repeat(Math.max(0, pad))}\x1b[1m|\x1b[0m`;
  };

  console.log('\x1b[1m' + '='.repeat(W + 2) + '\x1b[0m');
  console.log(
    '\x1b[1m|\x1b[0m' + 'OXLINT MIGRATION STATUS'.padStart(39).padEnd(W) + '\x1b[1m|\x1b[0m'
  );
  console.log('\x1b[1m' + '='.repeat(W + 2) + '\x1b[0m\n');

  // Summary box
  const progressBar = printProgressBar(migratedToOxlint.length, migratable);

  console.log('\x1b[1m+' + '-'.repeat(W) + '+\x1b[0m');
  console.log(line(`  Migration Progress: ${progressBar}`));
  console.log('\x1b[1m+' + '-'.repeat(W) + '+\x1b[0m');
  console.log(
    line(
      `  \x1b[32m+\x1b[0m Running in oxlint:  ${String(migratedToOxlint.length).padStart(3)} rules`
    )
  );
  console.log(
    line(`  \x1b[33m~\x1b[0m Could migrate:      ${String(couldMigrate.length).padStart(3)} rules`)
  );
  console.log(
    line(
      `  \x1b[36mo\x1b[0m ESLint only:        ${String(eslintOnly.length).padStart(3)} rules (no oxlint support)`
    )
  );
  console.log(
    line(`  \x1b[90m-\x1b[0m Disabled:           ${String(disabledRules.length).padStart(3)} rules`)
  );
  console.log('\x1b[1m+' + '-'.repeat(W) + '+\x1b[0m');
  console.log(line(`  Total enabled rules:  ${String(totalEnabled).padStart(3)}`));
  console.log(
    line(
      `  Oxlint coverage:      ${formatPercent(migratedToOxlint.length, totalEnabled).padEnd(4)} of all enabled rules`
    )
  );
  console.log('\x1b[1m+' + '-'.repeat(W) + '+\x1b[0m\n');

  // Detailed sections
  if (migratedToOxlint.length > 0) {
    console.log(`\x1b[32m\x1b[1m[+] RUNNING IN OXLINT (${migratedToOxlint.length}):\x1b[0m`);
    console.log('\x1b[90m    ESLint rules now handled by oxlint (faster!)\x1b[0m');
    for (const rule of migratedToOxlint) {
      console.log(`    \x1b[32m-\x1b[0m ${rule}`);
    }
    console.log('');
  }

  if (couldMigrate.length > 0) {
    console.log(`\x1b[33m\x1b[1m[~] COULD MIGRATE (${couldMigrate.length}):\x1b[0m`);
    console.log(
      '\x1b[90m    ESLint rules that oxlint supports but not enabled in .oxlintrc.json\x1b[0m'
    );
    for (const rule of couldMigrate) {
      console.log(`    \x1b[33m-\x1b[0m ${rule}`);
    }
    console.log('');
  }

  if (eslintOnly.length > 0) {
    console.log(`\x1b[36m\x1b[1m[o] ESLINT ONLY (${eslintOnly.length}):\x1b[0m`);
    console.log('\x1b[90m    Rules with no oxlint equivalent - must stay in ESLint\x1b[0m');
    for (const rule of eslintOnly) {
      console.log(`    \x1b[36m-\x1b[0m ${rule}`);
    }
    console.log('');
  }

  // Oxlint-only rules (not from ESLint)
  const allOxlintRules: Record<string, RuleConfig> = {
    ...oxlintConfig.rules,
  };
  if (oxlintConfig.overrides) {
    for (const override of oxlintConfig.overrides) {
      if (override.rules) {
        Object.assign(allOxlintRules, override.rules);
      }
    }
  }

  const oxcRules = Object.entries(allOxlintRules)
    .filter(([rule, status]) => {
      const severity = Array.isArray(status) ? status[0] : status;
      return rule.startsWith('oxc/') && severity !== 'off';
    })
    .map(([rule]) => rule)
    .sort();

  if (oxcRules.length > 0) {
    console.log(`\x1b[35m\x1b[1m[*] OXLINT-EXCLUSIVE RULES (${oxcRules.length}):\x1b[0m`);
    console.log('\x1b[90m    Extra rules only available in oxlint\x1b[0m');
    for (const rule of oxcRules) {
      console.log(`    \x1b[35m-\x1b[0m ${rule}`);
    }
    console.log('');
  }
}

mainAsync().catch(console.error);
