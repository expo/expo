// @ref llp/0006-agent-native-cli-surface.rfc.md §Output contract — the three channels of one run:
// the terse text, the `--json` object, and the `cli:config_effective` event.
//
// The event carries counts only, never values. A config carries bundle identifiers, URL schemes and
// permission strings; those belong in the answer the caller asked for, not in a telemetry stream.

import { event } from '../events';
import { buildConfigEffectiveFollowUps, followUpsEnabled, reportFollowUps } from '../followups';
import * as Log from '../log';
import { readStaticAppConfigAsync } from '../project/appConfig';
import {
  assertFilePlatform,
  buildEffectiveConfig,
  resolveModFile,
  resolvePlatformFilter,
} from './effective';
import { formatEffectiveConfig, formatModFile } from './format';
import { introspectConfigAsync } from './introspectAsync';
import type { EffectiveConfigPayload } from './types';

export interface EffectiveConfigOptions {
  /** Raw `--platform` value; `all` when the flag was not passed. */
  platform?: string;
  /** Raw `--file` value; null prints the summary. */
  file?: string | null;
  json?: boolean;
  /** Attach the state-aware next actions, cleared by `--no-followups`. */
  followups?: boolean;
}

/** Introspect the project's config, then report it on all three channels. */
export async function printEffectiveConfigAsync(
  projectRoot: string,
  options: EffectiveConfigOptions
): Promise<void> {
  // The flags are resolved before the subprocess: a typo in `--file` must not cost the caller the
  // second and a half that introspecting a real project takes.
  const platform = resolvePlatformFilter(options.platform);
  const file = resolveModFile(options.file);
  assertFilePlatform(file, platform);

  const [{ config, command, durationMs }, staticConfig] = await Promise.all([
    introspectConfigAsync(projectRoot),
    readStaticAppConfigAsync(projectRoot),
  ]);

  const report = buildEffectiveConfig({
    projectRoot,
    config,
    declaredPluginIds: staticConfig.plugins.map((plugin) => plugin.id),
    command,
    durationMs,
    platform,
    file,
  });

  event('config_effective', {
    configuredSdkVersion: report.configuredSdkVersion,
    platforms: Object.keys(report.platforms),
    modCounts: Object.fromEntries(
      Object.entries(report.platforms).map(([name, mods]) => [name, Object.keys(mods).length])
    ),
    pluginCount: report.plugins.length,
    declaredPluginCount: report.plugins.filter((plugin) => plugin.declared).length,
    expoAutolinkedModuleCount: report.expoAutolinkedModules.length,
    durationMs: report.source.durationMs,
  });

  const followups = followUpsEnabled(options.followups)
    ? buildConfigEffectiveFollowUps({ report, json: !!options.json, file })
    : [];

  if (options.json) {
    const payload: EffectiveConfigPayload = { ...report, followups };
    Log.log(JSON.stringify(payload, null, 2));
  } else {
    Log.log(file == null ? formatEffectiveConfig(report) : formatModFile(report, file));
  }

  reportFollowUps('inspect:config-plugins', followups, { json: !!options.json });
}
