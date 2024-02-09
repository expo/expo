import path from 'path';
import resolveFrom from 'resolve-from';

import { DestinationResolutionProps, selectTemplatesAsync, TEMPLATES } from './templates';
import { installAsync } from '../install/installAsync';
import { Log } from '../log';
import { copyAsync } from '../utils/dir';
import { CommandError } from '../utils/errors';

export async function queryAndGenerateAsync(
  projectRoot: string,
  {
    files,
    props,
    extras,
  }: {
    files: string[];
    props: DestinationResolutionProps;
    /** Any extra props to pass to the install command. */
    extras: any[];
  }
) {
  const valid = files.filter(
    (file) => !!TEMPLATES.find((template) => template.destination(props) === file)
  );

  if (valid.length !== files.length) {
    const diff = files.filter(
      (file) => !TEMPLATES.find((template) => template.destination(props) === file)
    );
    throw new CommandError(
      `Invalid files: ${diff.join(', ')}. Allowed: ${TEMPLATES.map((template) =>
        template.destination(props)
      ).join(', ')}`
    );
  }

  if (!valid.length) {
    return;
  }
  Log.log(`Generating: ${valid.join(', ')}`);
  return generateAsync(projectRoot, {
    answer: files.map((file) =>
      TEMPLATES.findIndex((template) => template.destination(props) === file)
    ),
    props,
    extras,
  });
}

/** Select templates to generate then generate and install. */
export async function selectAndGenerateAsync(
  projectRoot: string,
  {
    props,
    extras,
  }: {
    props: DestinationResolutionProps;
    /** Any extra props to pass to the install command. */
    extras: any[];
  }
) {
  const answer = await selectTemplatesAsync(projectRoot, props);

  if (!answer?.length) {
    Log.exit('\n\u203A Exiting with no change...', 0);
  }

  await generateAsync(projectRoot, {
    answer,
    props,
    extras,
  });
}

async function generateAsync(
  projectRoot: string,
  {
    answer,
    props,
    extras,
  }: {
    answer: number[];
    props: DestinationResolutionProps;
    /** Any extra props to pass to the install command. */
    extras: any[];
  }
) {
  // Copy files
  await Promise.all(
    answer.map(async (file) => {
      const template = TEMPLATES[file];

      if (template.id === 'tsconfig.json') {
        const { typescript } = await import('./typescript.js');
        return typescript(projectRoot);
      }

      const projectFilePath = path.resolve(projectRoot, template.destination(props));
      // copy the file from template
      return copyAsync(template.file(projectRoot), projectFilePath, {
        overwrite: true,
        recursive: true,
      });
    })
  );

  // Install dependencies
  const packages = answer
    .map((file) => TEMPLATES[file].dependencies)
    .flat()
    .filter((pkg) => !resolveFrom.silent(projectRoot, pkg));
  if (packages.length) {
    Log.debug('Installing ' + packages.join(', '));
    await installAsync(packages, {}, ['--dev', ...extras]);
  }
}
