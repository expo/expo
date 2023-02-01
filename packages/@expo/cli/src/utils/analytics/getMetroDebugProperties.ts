import { ExpoConfig, getExpoSDKVersion } from '@expo/config';

import { resolveMetroVersionFromProject } from '../../start/server/metro/resolveFromProject';

export function getMetroDebugProperties(
  projectRoot: string,
  debugTool: { name: string; version?: string },
  exp?: ExpoConfig
) {
  return {
    sdkVersion: exp?.sdkVersion ?? getExpoSDKVersion(projectRoot),
    metroVersion: resolveMetroVersionFromProject(projectRoot),
    toolName: debugTool.name,
    toolVersion: debugTool.version,
  };
}
