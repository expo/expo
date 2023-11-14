import { ExpoConfig } from '@expo/config';

export type DebugTool = {
  name: string;
  version?: string;
};

export function getMetroDebugProperties(
  projectRoot: string,
  exp: ExpoConfig,
  debugTool: DebugTool
) {
  return {
    sdkVersion: exp.sdkVersion,
    metroVersion: require('metro/package.json').version,
    toolName: debugTool.name,
    toolVersion: debugTool.version,
  };
}
