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

export const isVersionedUrl = (url: string) => {
  return /https?:\/\/(.*)(\/versions\/.*)/.test(url);
};

export const replaceVersionInUrl = (url: string, replaceWith: string) => {
  const urlArr = url.split('/');
  urlArr[2] = replaceWith;
  return urlArr.join('/');
};

export const getVersionFromUrl = (url: string) => {
  return url.split('/')[2];
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
