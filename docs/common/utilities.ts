import GithubSlugger from 'github-slugger';
import { ReactNode, isValidElement, PropsWithChildren } from 'react';

import versions from '~/public/static/constants/versions.json';

const { BETA_VERSION, LATEST_VERSION } = versions;

function hasChildren(node: ReactNode) {
  return isValidElement<PropsWithChildren>(node);
}

/**
 * Converts any object to string accepted by _Slugger_.
 * This is needed, because sometimes we receive pure string node,
 * but sometimes (e.g. when using styled text), we receive whole object (React.Element)
 *
 * @param node React Node object to stringify
 */
export const toString = (node: ReactNode): string => {
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

export const generateSlug = (slugger: GithubSlugger, node: ReactNode, length = 7): string => {
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
  const versionString = `SDK ${version?.slice(1, 3)}`;

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

const missingHashStyleId = 'missing-hash-target-style';
const ensureMissingHashStyle = () => {
  if (document.getElementById(missingHashStyleId)) {
    return;
  }

  const style = document.createElement('style');
  style.id = missingHashStyleId;
  style.textContent = `
    a[data-missing-hash-target="true"] {
      color: #d93025 !important;
      text-decoration: underline !important;
      text-decoration-color: #d93025 !important;
      text-decoration-thickness: 2px;
      background-color: #fff3f2;
      border-radius: 4px;
      padding: 0 2px;
    }

    a[data-missing-hash-target="true"] code {
      color: #d93025 !important;
    }
  `;
  document.head.appendChild(style);
};

export function listMissingHashLinkTargets(apiName?: string) {
  if (process.env.NODE_ENV !== 'development') {
    return;
  }

  const stripHashAndTrailingSlash = (url: string) => url.split('#')[0].replace(/\/$/, '');
  const pageUrl = stripHashAndTrailingSlash(window.location.href);

  const localLinks = Array.from(
    document.querySelectorAll<HTMLAnchorElement>(
      `div.size-full.overflow-x-hidden.overflow-y-auto a`
    )
  )
    .filter(link => stripHashAndTrailingSlash(link.href) === pageUrl && link.hash.length > 1)
    .map(link => ({ link, hash: link.hash.slice(1) }));

  if (localLinks.length === 0) {
    return;
  }

  const availableIDs = new Set(Array.from(document.querySelectorAll('*[id]')).map(el => el.id));
  const missingEntries = localLinks.map(({ hash }) => hash).filter(hash => !availableIDs.has(hash));
  const missingSet = new Set(missingEntries);

  if (missingSet.size === 0) {
    localLinks.forEach(({ link }) => {
      link.removeAttribute('data-missing-hash-target');
    });
    return;
  }

  ensureMissingHashStyle();

  localLinks.forEach(({ link, hash }) => {
    if (!missingSet.has(hash)) {
      link.removeAttribute('data-missing-hash-target');
      return;
    }

    link.setAttribute('data-missing-hash-target', 'true');
    link.setAttribute('title', `Missing hash target: #${hash}`);
  });

  const isDevToolsOpen = () => {
    const gap = 160;
    return (
      Math.abs(window.outerWidth - window.innerWidth) > gap ||
      Math.abs(window.outerHeight - window.innerHeight) > gap
    );
  };

  const logAsTable = () => {
    /* eslint-disable no-console */
    console.group(`🚨 The following links targets are missing in the ${apiName} API reference:`);
    console.table(missingEntries);
    console.groupEnd();
  };

  const logWhenDevToolsReady = () => {
    if (isDevToolsOpen()) {
      logAsTable();
      return;
    }

    const handleFirstResize = () => {
      setTimeout(logAsTable, 0);
      window.removeEventListener('resize', handleFirstResize);
    };

    window.addEventListener('resize', handleFirstResize);
  };

  logWhenDevToolsReady();
}

export function versionToText(version: string): string {
  if (version === 'unversioned') {
    return 'Next (unversioned)';
  } else if (version === 'latest') {
    return `${formatSdkVersion(LATEST_VERSION)} (latest)`;
  } else if (BETA_VERSION && version === BETA_VERSION.toString()) {
    return `${formatSdkVersion(BETA_VERSION.toString())} (beta)`;
  }

  return formatSdkVersion(version);
}

export function formatSdkVersion(version: string): string {
  return version.includes('v') ? `SDK ${version.slice(1, 3)}` : `SDK ${version}`;
}

export function capitalize(str: string) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

/**
 * Throttles a function to only execute at most once per specified delay.
 * Useful for performance optimization of high-frequency events like scroll.
 *
 * @param func The function to throttle
 * @param delay The minimum time in milliseconds between function executions
 * @returns A throttled version of the function
 */
export function throttle<TArgs extends unknown[]>(
  func: (...args: TArgs) => void,
  delay: number
): (...args: TArgs) => void {
  let timeoutId: ReturnType<typeof setTimeout> | null = null;
  let lastExecuted = 0;

  return function throttled(...args: TArgs) {
    const now = Date.now();
    const timeSinceLastExecution = now - lastExecuted;

    const execute = () => {
      lastExecuted = now;
      func(...args);
    };

    if (timeSinceLastExecution >= delay) {
      if (timeoutId) {
        clearTimeout(timeoutId);
        timeoutId = null;
      }
      execute();
    } else {
      timeoutId ??= setTimeout(() => {
        timeoutId = null;
        execute();
      }, delay - timeSinceLastExecution);
    }
  };
}
