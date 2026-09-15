import { getOriginalEnv, loadProjectEnv, type EnvMode } from '@expo/env';
import spawnAsync from '@expo/spawn-async';
import path from 'path';
import { z } from 'zod';

import { AbortCommandError, CommandError } from '../../utils/errors';

const reportPrefix = 'EXPO_ANDROID_BUILD_MODE=';
const reportSchema = z.object({
  version: z.literal(1),
  projectPath: z.literal(':app'),
  variant: z.string().min(1),
  mode: z.enum(['development', 'production']),
});

export async function resolveBuildModeAsync(
  projectRoot: string,
  variant: string,
  originalEnv = getOriginalEnv()
) {
  if (typeof variant !== 'string' || !variant) {
    throw new CommandError('BAD_ARGS', '--variant must be a non-empty string');
  }

  // Mode-specific dotenv files must not change react.debuggableVariants.
  const mode: EnvMode = variant.toLowerCase().endsWith('release') ? 'production' : 'development';
  const systemEnv = { ...originalEnv, NODE_ENV: mode, BABEL_ENV: originalEnv.BABEL_ENV || mode };
  loadProjectEnv(projectRoot, { mode, systemEnv, silent: true });
  return queryBuildModeAsync(projectRoot, variant, systemEnv);
}

async function queryBuildModeAsync(
  projectRoot: string,
  variant: string,
  systemEnv: NodeJS.ProcessEnv
) {
  const androidProjectRoot = path.join(projectRoot, 'android');
  const gradlew = path.join(
    androidProjectRoot,
    process.platform === 'win32' ? 'gradlew.bat' : 'gradlew'
  );
  const initScript = path.join(
    path.dirname(require.resolve('@expo/cli/package.json')),
    'static/android/resolve-build-mode.gradle'
  );

  let stdout: string;
  try {
    ({ stdout } = await spawnAsync(
      gradlew,
      [
        ':app:expoResolveBuildMode',
        '--init-script',
        initScript,
        '--console=plain',
        '--quiet',
        `-Pexpo.android.variant=${variant}`,
      ],
      {
        cwd: androidProjectRoot,
        stdio: ['inherit', 'pipe', 'inherit'],
        env: systemEnv,
      }
    ));
  } catch (error) {
    if (typeof error === 'object' && error !== null && 'status' in error && error.status === 130) {
      throw new AbortCommandError();
    }
    throw error;
  }

  const reports = stdout.split(/\r?\n/).filter((line) => line.startsWith(reportPrefix));
  if (reports.length !== 1) {
    throw new CommandError(
      'ANDROID_BUILD_MODE',
      `Gradle did not report one build mode for Android variant '${variant}'.`
    );
  }

  let report: unknown;
  try {
    report = JSON.parse(reports[0]!.slice(reportPrefix.length));
  } catch {
    throw new CommandError('ANDROID_BUILD_MODE', 'Gradle returned an invalid build mode report.');
  }
  const result = reportSchema.safeParse(report);
  if (!result.success || result.data.variant.toLowerCase() !== variant.toLowerCase()) {
    throw new CommandError(
      'ANDROID_BUILD_MODE',
      `Gradle returned an invalid build mode report for Android variant '${variant}'.`
    );
  }
  return { variant: result.data.variant, mode: result.data.mode };
}
