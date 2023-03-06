import { getConfig } from '@expo/config';

import { findUpProjectRootOrAssert } from '../utils/findUp';
import { setNodeEnv } from '../utils/nodeEnv';
import { queryAndGenerateAsync, selectAndGenerateAsync } from './generate';
import { Options } from './resolveOptions';
import { DestinationResolutionProps } from './templates';

export async function customizeAsync(files: string[], options: Options, extras: any[]) {
  setNodeEnv('development');
  // Locate the project root based on the process current working directory.
  // This enables users to run `npx expo customize` from a subdirectory of the project.
  const projectRoot = findUpProjectRootOrAssert(process.cwd());

  // Get the static path (defaults to 'web/')
  // Doesn't matter if expo is installed or which mode is used.
  const { exp } = getConfig(projectRoot, {
    skipSDKVersionRequirement: true,
  });

  // Create the destination resolution props which are used in both
  // the query and select functions.
  const props: DestinationResolutionProps = {
    webStaticPath: exp.web?.staticPath ?? 'web',
  };

  // If the user provided files, we'll generate them without prompting.
  if (files.length) {
    return queryAndGenerateAsync(projectRoot, {
      files,
      props,
      extras,
    });
  }

  // Otherwise, we'll prompt the user to select which files to generate.
  await selectAndGenerateAsync(projectRoot, {
    props,
    extras,
  });
}
