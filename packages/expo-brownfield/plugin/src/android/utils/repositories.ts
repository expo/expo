import path from 'node:path';

import type {
  EnvValue,
  LocalDirectoryPublication,
  Publication,
  RemotePrivatePublication,
  RemotePublicPublication,
} from '../types';
import { escapeGroovyDoubleQuotedString } from './validation';

const repositoryTemplates = {
  localMaven: () => ['    localDefault {', '        type.set("localMaven")', '    }'],
  localDirectory: (count: number, publication: LocalDirectoryPublication, projectRoot: string) => {
    const nameOrPlaceholder = publication.name ?? `localDirectory${count + 1}`;
    const resolvedPath = standardizePath(publication.path, projectRoot);
    return [
      `    ${nameOrPlaceholder} {`,
      '        type.set("localDirectory")',
      `        url.set("file://${escapeGroovyDoubleQuotedString(resolvedPath)}")`,
      '    }',
    ];
  },
  remotePublic: (count: number, publication: RemotePublicPublication, _projectRoot: string) => {
    const nameOrPlaceholder = publication.name ?? `remotePublic${count + 1}`;
    return [
      `    ${nameOrPlaceholder} {`,
      '        type.set("remotePublic")',
      setProperty('url', publication.url),
      `        allowInsecure.set(${publication.allowInsecure ?? false})`,
      '    }',
    ];
  },
  remotePrivate: (count: number, publication: RemotePrivatePublication, _projectRoot: string) => {
    const nameOrPlaceholder = publication.name ?? `remotePrivate${count + 1}`;
    return [
      `    ${nameOrPlaceholder} {`,
      '        type.set("remotePrivate")',
      setProperty('url', publication.url),
      setProperty('username', publication.username),
      setProperty('password', publication.password),
      `        allowInsecure.set(${publication.allowInsecure ?? false})`,
      '    }',
    ];
  },
} as const;

export const addRepository = (lines: string[], projectRoot: string, publication: Publication) => {
  switch (publication.type) {
    case 'localMaven':
      return countOccurences(lines, 'localDefault') > 0 ? [] : repositoryTemplates.localMaven();
    case 'localDirectory':
    case 'remotePublic':
    case 'remotePrivate':
      return repositoryTemplates[publication.type](
        countOccurences(lines, `type.set("${publication.type}")`),
        // @ts-expect-error - TypeScript can't narrow union in fall-through case
        publication,
        projectRoot
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

const setProperty = (property: string, value: string | EnvValue) => {
  if (typeof value === 'string') {
    return `        ${property}.set("${escapeGroovyDoubleQuotedString(value)}")`;
  }

  // `value.variable` is validated as an env var identifier upstream, so no escaping needed.
  return `        ${property}.set(providers.environmentVariable("${value.variable}").orElse(""))`;
};
