import path from 'node:path';

import {
  LocalDirectoryPublication,
  Publication,
  RemotePrivateBasicPublication,
  RemotePrivatePublicationInternal,
  RemotePublicPublication,
} from '../types';

const repositoryTemplates = {
  localMaven: () => [
    '    localDefault {',
    '        type = "localMaven"',
    '    }',
  ],
  localDirectory: (
    count: number,
    publication: LocalDirectoryPublication,
    projectRoot: string,
  ) => {
    const nameOrPlaceholder = publication.name ?? `localDirectory${count + 1}`;
    return [
      `    ${nameOrPlaceholder} {`,
      '        type = "localDirectory"',
      `        url = "file://${standardizePath(publication.path, projectRoot)}"`,
      '    }',
    ];
  },
  remotePublic: (
    count: number,
    publication: RemotePublicPublication,
    _projectRoot: string,
  ) => {
    const nameOrPlaceholder = publication.name ?? `remotePublic${count + 1}`;
    return [
      `    ${nameOrPlaceholder} {`,
      '        type = "remotePublic"',
      `        url = "${publication.url}"`,
      `        allowInsecure = ${publication.allowInsecure}`,
      '    }',
    ];
  },
  remotePrivate: (
    count: number,
    publication: RemotePrivatePublicationInternal,
    _projectRoot: string,
  ) => {
    const nameOrPlaceholder = publication.name ?? `remotePrivate${count + 1}`;
    return [
      `    ${nameOrPlaceholder} {`,
      '        type = "remotePrivate"',
      `        url = "${publication.url}"`,
      `        username = "${publication.username}"`,
      `        password = "${publication.password}"`,
      `        allowInsecure = ${publication.allowInsecure}`,
      '    }',
    ];
  },
} as const;

export const addRepository = (
  lines: string[],
  projectRoot: string,
  publication: Publication,
) => {
  switch (publication.type) {
    case 'localMaven':
      const isAlreadyAdded = countOccurences(lines, 'localDefault') > 0;
      return isAlreadyAdded ? [] : repositoryTemplates.localMaven();
    case 'localDirectory':
    case 'remotePublic':
    case 'remotePrivate':
      const count = countOccurences(lines, `type = "${publication.type}"`);
      if (publication.type === 'remotePrivate') {
        publication = resolveEnv(publication);
      }
      return repositoryTemplates[publication.type](
        count,
        // @ts-expect-error - TypeScript can't narrow union in fall-through case
        publication,
        projectRoot,
      );
    default:
      // @ts-expect-error - Non-existent, invalid publication type
      console.warn(`Unknown publication type: "${publication.type}"`);
      return [];
  }
};

const countOccurences = (lines: string[], pattern: string) => {
  return lines.filter((line) => line.includes(pattern)).length;
};

const standardizePath = (url: string, projectRoot: string) => {
  return path.isAbsolute(url) ? url : path.join(projectRoot, url);
};

const resolveEnv = (
  publication: RemotePrivateBasicPublication,
): RemotePrivatePublicationInternal => {
  const publicationInternal = {
    ...publication,
  };

  if (typeof publication.url === 'object') {
    publicationInternal.url = findEnvOrThrow(publication.url.variable);
  }

  if (typeof publication.username === 'object') {
    publicationInternal.username = findEnvOrThrow(
      publication.username.variable,
    );
  }

  if (typeof publication.password === 'object') {
    publicationInternal.password = findEnvOrThrow(
      publication.password.variable,
    );
  }

  return publicationInternal as RemotePrivatePublicationInternal;
};

const findEnvOrThrow = (envVariable: string) => {
  if (process.env[envVariable]) {
    return process.env[envVariable];
  }

  throw new Error(
    `Environment variable: "${envVariable}" used to define publishing configuration not found`,
  );
};
