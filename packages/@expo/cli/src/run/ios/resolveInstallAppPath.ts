import { IOSConfig, XML } from '@expo/config-plugins';
import { sync as globSync } from 'glob';
import path from 'path';
import { z } from 'zod';

import { CommandError } from '../../utils/errors';
import type { BuildProps } from './XcodeBuild.types';

const launchActionSchema = z.object({
  Scheme: z.object({
    LaunchAction: z.tuple([
      z.object({
        BuildableProductRunnable: z.tuple([
          z.object({
            BuildableReference: z.tuple([
              z.object({ $: z.object({ BuildableName: z.string().endsWith('.app') }) }),
            ]),
          }),
        ]),
      }),
    ]),
  }),
});

export async function resolveInstallAppPathAsync(
  {
    projectRoot,
    scheme,
    xcodeProject,
  }: Pick<BuildProps, 'projectRoot' | 'scheme' | 'xcodeProject'>,
  appPaths: readonly string[]
): Promise<string> {
  const [onlyApp] = appPaths;
  if (appPaths.length === 1 && onlyApp !== undefined) return onlyApp;

  const selectionError = new CommandError(
    'IOS_AMBIGUOUS_APP',
    `Cannot select an app to install from scheme "${scheme}". Choose one of the compiled apps as the scheme's Run executable.\n${appPaths.join('\n')}`
  );
  if (appPaths.length === 0 || path.basename(scheme) !== scheme) throw selectionError;

  const containerPath = path.resolve(projectRoot, xcodeProject.name);
  const containerSchemes = globSync(
    ['xcshareddata/xcschemes/*.xcscheme', 'xcuserdata/*/xcschemes/*.xcscheme'],
    { cwd: containerPath, absolute: true }
  );
  if (xcodeProject.isWorkspace) {
    containerSchemes.push(
      ...IOSConfig.Paths.findSchemePaths(projectRoot),
      ...globSync('ios/*.xcodeproj/xcuserdata/*/xcschemes/*.xcscheme', {
        cwd: projectRoot,
        absolute: true,
      })
    );
  }
  const schemePaths = [
    ...new Set(containerSchemes.map((schemePath) => path.resolve(schemePath))),
  ].filter((schemePath) => path.basename(schemePath, '.xcscheme') === scheme);
  const [schemePath] = schemePaths;
  if (schemePaths.length !== 1 || schemePath === undefined) throw selectionError;

  let runnableName: string;
  try {
    const parsed = launchActionSchema.parse(await XML.readXMLAsync({ path: schemePath }));
    runnableName =
      parsed.Scheme.LaunchAction[0].BuildableProductRunnable[0].BuildableReference[0].$
        .BuildableName;
  } catch (cause) {
    selectionError.cause = cause;
    throw selectionError;
  }

  const candidates = appPaths.filter((appPath) => path.basename(appPath) === runnableName);
  const [appPath] = candidates;
  if (candidates.length !== 1 || appPath === undefined) throw selectionError;
  return appPath;
}
