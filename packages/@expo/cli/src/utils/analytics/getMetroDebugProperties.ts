import { ExpoConfig } from '@expo/config';

import { resolveMetroVersionFromProject } from '../../start/server/metro/resolveFromProject';

export type DebugTool = {
  name: string;
  version?: string;
};

export function getMetroDebugProperties(
  projectRoot: string,
  debugTool: DebugTool,
  exp?: ExpoConfig
) {
  return {
    sdkVersion: exp?.sdkVersion,
    metroVersion: resolveMetroVersionFromProject(projectRoot),
    toolName: debugTool.name,
    toolVersion: debugTool.version,
  };
}
