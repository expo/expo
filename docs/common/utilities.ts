import GithubSlugger from 'github-slugger';

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
  const slug = slugger.slug(stringToSlug);

  return slug;
};

export const isVersionedUrl = (url: string) => {
  return url.startsWith('/versions/') || /https?:\/\/(.*)(\/versions\/.*)/.test(url);
};

export const replaceVersionInUrl = (url: string, replaceWith: string) => {
  const urlArr = url.split('/');
  urlArr[2] = replaceWith;
  return urlArr.join('/');
};

export const getVersionFromUrl = (url: string) => {
  return new URL(url, 'https://docs.expo.dev').pathname.split('/')[2];
};

/**
 * Get the user facing or human-readable version from the SDK verion.
 * If you provide a `latestVersion`, `latest` will include the sdk version in parentheses.
 */
export const getUserFacingVersionString = (
  version: string,
  latestVersion?: string,
  betaVersion?: string
): string => {
  if (version === 'latest') {
    return latestVersion ? `Latest (${getUserFacingVersionString(latestVersion)})` : 'Latest';
  } else if (version === 'unversioned') {
    return 'Unversioned';
  }

  const versionString = `SDK${version?.substring(1, 3)}`;

  if (version === betaVersion) {
    return `Beta (${versionString})`;
  }

  return versionString;
};
