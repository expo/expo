import spawnAsync from '@expo/spawn-async';
import { sync as globSync } from 'glob';
import type { BuildIosOptions } from './buildIosAsync';
import path from 'node:path';

export async function resolveOptionsAsync(projectRoot: string, args: Record<string, string | boolean | undefined>): Promise<BuildIosOptions> {
  if (args['--development'] && args['--production']) {
    throw new Error('Expected one of `--development` or `--production`');
  }
  
  const xcodeProject = await resolveXcodeProject(projectRoot);

  const defaultConfiguration = args['--development'] ? 'Debug' : 'Release';
  let defaultFormat = 'ipa';
  if (args['--output-binary'] && ['app', 'ipa'].includes(path.extname(args['--output-binary'] as string).substring(1))) {
    defaultFormat = path.extname(args['--output-binary'] as string).substring(1);
  } else if (args['--development']) {
    defaultFormat = 'app';
  }

  const format = args['--format'];
  if (format && format !== 'ipa' && format !== 'app') {
    throw new Error(`Unexpected "--format" provided: ${args['--format']}`);
  }

  return {
    scheme: (args['--scheme'] as string) || xcodeProject.scheme,
    configuration: (args['--configuration'] as string) || defaultConfiguration,
    format: (format as any) || defaultFormat,
    outputFile: (args['--output-binary'] as string) || `./${xcodeProject.name}.${(format as any) || defaultFormat}`,
    xcodeFlags: args['--extra-flags'] as string,
  };
}

function findXcodeProjectPaths(
  projectRoot: string,
  extension: 'xcworkspace' | 'xcodeproj'
): string[] {
  return globSync(`ios/*.${extension}`, {
    absolute: true,
    cwd: projectRoot,
    ignore: ['**/@(Carthage|Pods|vendor|node_modules)/**'],
  });
}

async function findXcodeProjectInfo(projectRoot: string, xcproj: string) {
  const { stdout } = await spawnAsync('xcodebuild', ['-list', '-json', '-project', xcproj]);
  return JSON.parse(stdout)?.project as {
    configurations: string[]; // Debug,Release
    name: string;
    schemes: string[]; // testexpobuild
    targets: string[]; // "testexpobuild"
  };
}

async function findXcodeWorkspaceInfo(projectRoot: string, xcworkspace: string) {
  const { stdout } = await spawnAsync('xcodebuild', ['-list','-json', '-workspace', xcworkspace]);
  return JSON.parse(stdout)?.workspace as {
    name: string;
    schemes: string[];
  };
}

async function resolveXcodeProject(projectRoot: string) {
  // todo - combine
  const xcproj = findXcodeProjectPaths(projectRoot, 'xcodeproj');
  const xcworkspace = findXcodeProjectPaths(projectRoot, 'xcworkspace');
  
  if (xcproj.length) {
    const projectInfo = await findXcodeProjectInfo(projectRoot, xcproj[0]);
    return {
      workspacePath: xcworkspace[0],
      projectPath: xcproj[0],
      name: projectInfo?.name,
      scheme: projectInfo?.schemes[0],
    }
  }

  if (xcworkspace.length) {
    const workspaceInfo = await findXcodeWorkspaceInfo(projectRoot, xcworkspace[0]);
    return {
      workspacePath: xcworkspace[0],
      projectPath: null,
      name: workspaceInfo.name,
      scheme: workspaceInfo.name,
    }
  }

  throw new Error('Could not find "*.xcodeproj" or "*.xcworkspace" files');
}
