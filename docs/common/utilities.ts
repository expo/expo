import GithubSlugger from 'github-slugger';
import React from 'react';

function hasChildren(node: React.ReactNode): node is React.ReactElement {
  return (node as React.ReactElement)?.props?.children !== undefined;
}

/**
 * Converts any object to string accepted by _Slugger_.
 * This is needed, because sometimes we receive pure string node,
 * but sometimes (e.g. when using styled text), we receive whole object (React.Element)
 *
 * @param {React.ReactNode} node React Node object to stringify
 */
export const toString = (node: React.ReactNode): string => {
  if (typeof node === 'string') {
    return node;
  } else if (Array.isArray(node)) {
    return node.map(toString).join('');
  } else if (hasChildren(node)) {
    return toString(node.props.children);
  } else {
    return '';
  }
};

export const generateSlug = (slugger: GithubSlugger, node: React.ReactNode, length = 7): string => {
  const stringToSlug = toString(node).split(' ').splice(0, length).join('-');

  // NOTE(jim): This will strip out commas from stringToSlug
  return slugger.slug(stringToSlug);
};

/**
 * Replace the version in the pathname from the URL.
 */
export const replaceVersionInUrl = (url: string, replaceWith: string) => {
  const urlArr = url.split('/');
  urlArr[2] = replaceWith;
  return urlArr.join('/');
};

/**
 * Get the user facing or human-readable version from the SDK version.
 * If you provide a `latestVersion` or `betaVersion`, matching entries will include the correct label in parentheses.
 */
export const getUserFacingVersionString = (
  version: string,
  latestVersion?: string,
  betaVersion?: string
): string => {
  const versionString = `SDK ${version?.substring(1, 3)}`;

  if (version === 'latest') {
    return latestVersion ? `${getUserFacingVersionString(latestVersion)} (Latest)` : 'Latest';
  } else if (version === betaVersion) {
    return `${versionString} (Beta)`;
  } else if (version === 'unversioned') {
    return 'Unversioned';
  }

  return versionString;
};

export const stripVersionFromPath = (path?: string) => {
  if (!path) {
    return path;
  }
  return path.replace(/\/versions\/[\w.]+/, '');
};

export const pathStartsWith = (name: string, path: string) => {
  return path.startsWith(`/${name}`);
};

export const chunkArray = (array: any[], chunkSize: number) => {
  return array.reduce((acc, _, i) => {
    if (i % chunkSize === 0) acc.push(array.slice(i, i + chunkSize));
    return acc;
  }, []);
};

export function listMissingHashLinkTargets(apiName?: string) {
  const contentLinks = document.querySelectorAll(
    `div.size-full.overflow-x-hidden.overflow-y-auto a`
  ) as NodeListOf<HTMLAnchorElement>;

  const wantedHashes = Array.from(contentLinks)
    .map(link => {
      if (link.hostname !== 'localhost' || !link.href.startsWith(link.baseURI.split('#')[0])) {
        return '';
      }
      return link.hash.substring(1);
    })
    .filter(hash => hash !== '');

  const availableIDs = Array.from(document.querySelectorAll('*[id]')).map(link => link.id);
  const missingEntries = wantedHashes.filter(hash => !availableIDs.includes(hash));

  if (missingEntries.length) {
    console.group(`🚨 The following links targets are missing in the ${apiName} API reference:`);
    console.table(missingEntries);
    console.groupEnd();
  }
}
