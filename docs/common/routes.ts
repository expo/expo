import * as Utilities from '~/common/utilities';
import { stripVersionFromPath } from '~/common/utilities';
import { PageApiVersionContextType } from '~/providers/page-api-version';
import navigation from '~/public/static/constants/navigation.json';
import { NavigationRoute, NavigationRouteWithSection } from '~/types/common';

export const getRoutes = (
  path: string,
  version: PageApiVersionContextType['version']
): NavigationRoute[] => {
  if (isReferencePath(path)) {
    return navigation.reference[version] as NavigationRoute[];
  } else {
    return navigation[getPageSection(path)] as NavigationRoute[];
  }
};

export const isArchivePath = (path: string) => {
  return Utilities.pathStartsWith('archive', path);
};

export const isVersionedPath = (path: string) => {
  return Utilities.pathStartsWith('versions', path);
};

export const isReferencePath = (path: string) => {
  return navigation.referenceDirectories.some(name => Utilities.pathStartsWith(name, path));
};

export const isHomePath = (path: string) => {
  return navigation.homeDirectories.some(name => Utilities.pathStartsWith(name, path));
};

export const isGeneralPath = (path: string) => {
  return navigation.generalDirectories.some(name => Utilities.pathStartsWith(name, path));
};

export const isFeaturePreviewPath = (path: string) => {
  return navigation.featurePreview.some(name => Utilities.pathStartsWith(name, path));
};

export const isPreviewPath = (path: string) => {
  return navigation.previewDirectories.some(name => Utilities.pathStartsWith(name, path));
};

export const isLearnPath = (path: string) => {
  return navigation.learnDirectories.some(name => Utilities.pathStartsWith(name, path));
};

export const getPageSection = (path: string) => {
  if (isReferencePath(path)) {
    return 'reference';
  } else if (isGeneralPath(path)) {
    return 'general';
  } else if (isFeaturePreviewPath(path)) {
    return 'featurePreview';
  } else if (isPreviewPath(path)) {
    return 'preview';
  } else if (isArchivePath(path)) {
    return 'archive';
  } else if (isLearnPath(path)) {
    return 'learn';
  } else if (isHomePath(path)) {
    return 'home';
  }

  return 'home';
};

export const getCanonicalUrl = (path: string) => {
  if (isReferencePath(path)) {
    return `https://docs.expo.dev${Utilities.replaceVersionInUrl(path, 'latest')}/`;
  } else if (path !== `/`) {
    return `https://docs.expo.dev${path}/`;
  } else {
    return `https://docs.expo.dev`;
  }
};

export const isRouteActive = (
  info?: NavigationRoute | NavigationRouteWithSection,
  asPath?: string,
  pathname?: string
) => {
  // Special case for root url
  if (info?.name === 'Introduction') {
    if (asPath?.match(/\/versions\/[\w.]+\/$/) || asPath === '/versions/latest/') {
      return true;
    }
  }

  const linkUrl = stripVersionFromPath(info?.as || info?.href);
  return linkUrl === stripVersionFromPath(pathname) || linkUrl === stripVersionFromPath(asPath);
};

export function appendSectionToRoute(route?: NavigationRouteWithSection) {
  if (route?.children) {
    return route.children.map((entry: NavigationRouteWithSection) =>
      route.type !== 'page'
        ? Object.assign(entry, {
            section: route.section ? `${route.section} - ${route.name}` : route.name,
          })
        : route
    );
  }
  return route;
}
