// @ref llp/0006-agent-native-cli-surface.rfc.md §Output contract — one fact per line, `label value`
// style. The default output is counts, because the values themselves are kilobytes of plist and XML
// that nobody reads by eye; `--file` prints one of them and `--json` prints all of them.

import chalk from 'chalk';

import { CONFIG_PLATFORMS } from './effective';
import type { EffectiveConfigReport, PlatformMods } from './types';

/** Width of the label column, matching `@expo/agent-cli status`. */
const LABEL_WIDTH = 13;

/** Separates the facts inside one line. */
const SEPARATOR = ', ';

/** The summary report: one line per platform, plus what introspection never answers. */
export function formatEffectiveConfig(report: EffectiveConfigReport): string {
  const lines = [
    row('Project', report.projectRoot),
    // "per config", because `@expo/agent-cli status` prints an `SDK` of its own and it is the installed
    // `expo` version. Two numbers under one label is what made them look like a disagreement.
    row(
      'SDK',
      `${report.configuredSdkVersion ?? chalk.yellow('unknown')} ${chalk.dim('per config')}`
    ),
    row('Plugins', pluginsLine(report)),
    // "Expo modules", not "Autolinked": the list covers Expo-module autolinking only, and a label
    // that did not say so answered a question it had never been asked (F35).
    row(
      'Autolinked',
      `${report.expoAutolinkedModules.length} Expo modules ${chalk.dim(
        '(React Native community modules link separately)'
      )}`
    ),
  ];

  for (const platform of CONFIG_PLATFORMS) {
    const mods = report.platforms[platform];
    if (mods) {
      lines.push(row(platform, modsLine(mods)));
    }
  }

  lines.push(row('Not covered', report.notAttributable.join(SEPARATOR)));
  return lines.join('\n');
}

/**
 * Mods that are a flat list of settings, and print as sorted `key value` lines.
 *
 * Per mod rather than by inspecting the value, because "flat" is not a property of the value: a
 * real `Info.plist` has a nested `NSAppTransportSecurity` in it and is still a settings file, while
 * `strings` is one key deep (`resources`) and is a document tree. The mod name is what says which.
 */
const KEY_VALUE_MODS = new Set(['infoPlist', 'entitlements', 'expoPlist', 'podfileProperties']);

/**
 * One mod under a `<platform>.<mod>` header.
 *
 * A settings file prints as sorted `key value` lines, one setting per line, which is the shape of
 * the rest of this CLI's output. A mod that is a document tree (`manifest`, `strings`) or an
 * ordered list (`gradleProperties`) prints as JSON: flattening it would lose the order and the
 * nesting that make it what it is.
 */
export function formatModFile(report: EffectiveConfigReport, file: string): string {
  const blocks: string[] = [];
  for (const platform of CONFIG_PLATFORMS) {
    const mods = report.platforms[platform];
    if (!mods || !(file in mods)) {
      continue;
    }
    blocks.push(`${chalk.bold(`${platform}.${file}`)}\n${formatModValue(file, mods[file])}`);
  }
  // Not an error: `--file entitlements` on a project with no entitlements is an answer, and the
  // answer is that the plugins produced none.
  return blocks.length
    ? blocks.join('\n\n')
    : chalk.yellow(`No ${file} was produced for this project.`);
}

/** The value of one mod: `key value` lines for a settings file, JSON for anything else. */
function formatModValue(file: string, value: unknown): string {
  if (
    KEY_VALUE_MODS.has(file) &&
    value != null &&
    typeof value === 'object' &&
    !Array.isArray(value)
  ) {
    const record = value as Record<string, unknown>;
    return (
      Object.keys(record)
        .sort()
        .map((key) => `${key} ${formatSetting(record[key])}`)
        .join('\n') || chalk.dim('(empty)')
    );
  }
  return JSON.stringify(value, null, 2);
}

/** One setting's value, kept on its key's line: a string as it is, anything else as compact JSON. */
function formatSetting(value: unknown): string {
  return typeof value === 'string' ? value : JSON.stringify(value);
}

function pluginsLine(report: EffectiveConfigReport): string {
  const declared = report.plugins.filter((plugin) => plugin.declared).length;
  const auto = report.plugins.length - declared;
  const counts = `${report.plugins.length} (${declared} declared, ${auto} auto)`;
  if (!report.declaredNotApplied.length) {
    return counts;
  }
  // F132: `1 declared` on a config that declares three is the reader's only clue that two are
  // missing, and it does not read as one. The gap goes on the same line as the count it qualifies.
  return `${counts} ${chalk.yellow(
    `— ${report.declaredNotApplied.length} declared not in the history: ${report.declaredNotApplied.join(
      SEPARATOR
    )}`
  )}`;
}

/** The mods of one platform, each with the count that says how much it holds. */
function modsLine(mods: PlatformMods): string {
  return (
    Object.keys(mods)
      .map((mod) => describeMod(mod, mods[mod]))
      .join(SEPARATOR) || chalk.dim('none')
  );
}

/**
 * One mod as `<name> <count> <unit>`.
 *
 * The unit is per mod because the counts mean different things: an `infoPlist` has keys, an
 * `AndroidManifest` is read for its permissions, and `gradleProperties` is a line list where only
 * the property lines are settings [all observed — a real SDK 57 introspection]. A count with the
 * wrong noun on it is worse than no count.
 */
export function describeMod(mod: string, value: unknown): string {
  const counted = countMod(mod, value);
  return counted == null ? mod : `${mod} ${counted.count} ${plural(counted.count, counted.unit)}`;
}

/** The count and its singular noun, or null for a mod nothing meaningful is counted in. */
function countMod(mod: string, value: unknown): { count: number; unit: string } | null {
  switch (mod) {
    case 'manifest':
      return {
        count: listLength(get(get(value, 'manifest'), 'uses-permission')),
        unit: 'permission',
      };
    case 'gradleProperties':
      return {
        count: Array.isArray(value)
          ? value.filter((entry) => get(entry, 'type') === 'property').length
          : 0,
        unit: 'property',
      };
    case 'strings':
      return { count: resourceLength(value, 'string'), unit: 'string' };
    case 'colors':
    case 'colorsNight':
      return { count: resourceLength(value, 'color'), unit: 'color' };
    case 'styles':
      return { count: resourceLength(value, 'style'), unit: 'style' };
    default:
      break;
  }
  if (Array.isArray(value)) {
    return { count: value.length, unit: 'entry' };
  }
  if (value != null && typeof value === 'object') {
    return { count: Object.keys(value).length, unit: 'key' };
  }
  return null;
}

/** How many `<resources><color/></resources>` children of one kind the mod holds. */
function resourceLength(value: unknown, child: string): number {
  return listLength(get(get(value, 'resources'), child));
}

function listLength(value: unknown): number {
  return Array.isArray(value) ? value.length : 0;
}

/** One property of an unknown value, without asserting its shape. */
function get(value: unknown, key: string): unknown {
  return value != null && typeof value === 'object'
    ? (value as Record<string, unknown>)[key]
    : undefined;
}

function plural(count: number, unit: string): string {
  if (count === 1) {
    return unit;
  }
  // A consonant before the `y` takes `-ies` (`entry`, `property`); a vowel takes `-s` (`key`).
  return /[^aeiou]y$/.test(unit) ? `${unit.slice(0, -1)}ies` : `${unit}s`;
}

function row(label: string, value: string): string {
  return `${chalk.dim(label.padEnd(LABEL_WIDTH))}${value}`;
}
