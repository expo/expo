import { IOSConfig, XML } from '@expo/config-plugins';
import fs from 'fs';
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
              z.object({
                $: z.object({
                  BlueprintIdentifier: z.string().min(1),
                  ReferencedContainer: z.string().startsWith('container:').endsWith('.xcodeproj'),
                }),
              }),
            ]),
          }),
        ]),
      }),
    ]),
  }),
});

const appBuildSettingsSchema = z.object({
  target: z.string(),
  buildSettings: z.object({
    PROJECT_FILE_PATH: z.string(),
    TARGET_BUILD_DIR: z.string(),
    WRAPPER_NAME: z.string().endsWith('.app'),
  }),
});

const nativeTargetSchema = z.object({
  isa: z.string().transform(IOSConfig.XcodeUtils.unquote).pipe(z.literal('PBXNativeTarget')),
  name: z
    .union([z.string(), z.number()])
    .transform((name) => IOSConfig.XcodeUtils.unquote(String(name)))
    .pipe(z.string().min(1)),
});

export interface XcodeBuildProduct {
  projectPath: string;
  targetName: string;
  appPath: string;
}

export function parseXcodeBuildProducts(output: string, cwd: string): XcodeBuildProduct[] {
  const settings = z.array(z.unknown()).parse(JSON.parse(output));
  return settings.flatMap((entry) => {
    const parsed = appBuildSettingsSchema.safeParse(entry);
    if (!parsed.success) return [];
    const { target, buildSettings } = parsed.data;
    return [
      {
        projectPath: path.resolve(cwd, buildSettings.PROJECT_FILE_PATH),
        targetName: target,
        appPath: path.resolve(cwd, buildSettings.TARGET_BUILD_DIR, buildSettings.WRAPPER_NAME),
      },
    ];
  });
}

export async function resolveInstallAppPathAsync(
  {
    projectRoot,
    scheme,
    xcodeProject,
  }: Pick<BuildProps, 'projectRoot' | 'scheme' | 'xcodeProject'>,
  appPaths: readonly string[],
  buildProducts: readonly XcodeBuildProduct[]
): Promise<string> {
  const [onlyApp] = appPaths;
  if (appPaths.length === 1 && onlyApp !== undefined) return onlyApp;

  const selectionError = new CommandError(
    'IOS_AMBIGUOUS_APP',
    `Cannot select an app to install from scheme "${scheme}". Choose one of the compiled apps as the scheme's Run executable.\n${appPaths.join('\n')}`
  );
  if (appPaths.length === 0 || path.basename(scheme) !== scheme) throw selectionError;

  const containerPath = path.resolve(projectRoot, xcodeProject.name);
  const schemePatterns = ['xcshareddata/xcschemes/*.xcscheme', 'xcuserdata/*/xcschemes/*.xcscheme'];
  const containerSchemes = globSync(schemePatterns, { cwd: containerPath, absolute: true });
  if (xcodeProject.isWorkspace) {
    for (const projectPath of new Set(buildProducts.map((product) => product.projectPath))) {
      containerSchemes.push(...globSync(schemePatterns, { cwd: projectPath, absolute: true }));
    }
    containerSchemes.push(
      ...IOSConfig.Paths.findSchemePaths(projectRoot),
      ...globSync('ios/*.xcodeproj/xcuserdata/*/xcschemes/*.xcscheme', {
        cwd: projectRoot,
        absolute: true,
      })
    );
  }
  try {
    const schemePaths = [
      ...new Set(
        containerSchemes
          .filter((schemePath) => path.basename(schemePath, '.xcscheme') === scheme)
          .map((schemePath) => fs.realpathSync(schemePath))
      ),
    ];
    const [schemePath] = schemePaths;
    if (schemePaths.length !== 1 || schemePath === undefined) throw selectionError;

    const parsed = launchActionSchema.parse(await XML.readXMLAsync({ path: schemePath }));
    const reference =
      parsed.Scheme.LaunchAction[0].BuildableProductRunnable[0].BuildableReference[0].$;
    const projectPath = fs.realpathSync(
      resolveReferencedProject(schemePath, reference.ReferencedContainer)
    );
    const project = IOSConfig.XcodeUtils.readXcodeProject(
      path.join(projectPath, 'project.pbxproj')
    );
    const objects: Record<string, unknown> = project.hash.project.objects;
    const nativeTargets = z.record(z.unknown()).optional().parse(objects.PBXNativeTarget);
    const targets = [
      nativeTargets?.[reference.BlueprintIdentifier],
      objects[reference.BlueprintIdentifier],
    ].filter((target) => target !== undefined);
    const [{ name: targetName }] = z.tuple([nativeTargetSchema]).parse(targets);
    const candidates = appPaths.filter((appPath) =>
      buildProducts.some(
        (product) =>
          product.targetName === targetName &&
          product.appPath === appPath &&
          fs.realpathSync(product.projectPath) === projectPath
      )
    );
    const [appPath] = candidates;
    if (candidates.length !== 1 || appPath === undefined) throw selectionError;
    return appPath;
  } catch (cause) {
    if (cause !== selectionError) selectionError.cause = cause;
    throw selectionError;
  }
}

function resolveReferencedProject(schemePath: string, referencedContainer: string): string {
  for (
    let directory = path.dirname(schemePath);
    directory !== path.dirname(directory);
    directory = path.dirname(directory)
  ) {
    if (directory.endsWith('.xcodeproj') || directory.endsWith('.xcworkspace')) {
      return path.resolve(path.dirname(directory), referencedContainer.slice('container:'.length));
    }
  }
  throw new Error(`Cannot find the container for Xcode scheme ${schemePath}.`);
}
