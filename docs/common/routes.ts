import * as Utilities from '~/common/utilities';
import { PageApiVersionContextType } from '~/providers/page-api-version';
import navigation from '~/public/static/constants/navigation.json';
import { NavigationRoute } from '~/types/common';

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

export const isRouterPath = (path: string) => {
  return Utilities.pathStartsWith('router', path);
};

export const getPageSection = (path: string) => {
  if (isReferencePath(path)) {
    return 'reference';
  } else if (isRouterPath(path)) {
    return 'router';
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
