import { spawnExpoCLI } from './spawnExpoCLI';
import type { DoctorCheckParams } from '../checks/checks.types';

type ProjectConfig = Omit<DoctorCheckParams, 'projectRoot'>;

export async function getProjectConfigAsync(projectRoot: string): Promise<ProjectConfig> {
  const result = await spawnExpoCLI(projectRoot, ['config', '--json', '--full'], {
    stdio: 'pipe',
    env: { ...process.env, EXPO_DEBUG: '0' },
  });

  let parsed: any;
  try {
    parsed = JSON.parse(result.stdout);
  } catch {
    throw new Error(
      `Failed to parse JSON output from 'npx expo config --json --full'.\nOutput: ${result.stdout.slice(0, 500)}`
    );
  }

  if (!parsed.exp || !parsed.pkg) {
    throw new Error(
      `Unexpected output from 'npx expo config --json --full': missing 'exp' or 'pkg' fields.`
    );
  }

  if (!parsed.exp.sdkVersion) {
    throw new Error(
      `Cannot determine the project's Expo SDK version. This usually means the \`expo\` package is not installed. Install it with \`npx expo install expo\` and try again.`
    );
  }

  return {
    exp: parsed.exp,
    pkg: parsed.pkg,
    hasUnusedStaticConfig: parsed.hasUnusedStaticConfig ?? false,
    staticConfigPath: parsed.staticConfigPath ?? null,
    dynamicConfigPath: parsed.dynamicConfigPath ?? null,
  };
}
