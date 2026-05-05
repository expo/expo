import {
  buildLocalePath,
  getCanonicalPath,
  getJapaneseSectionTitle,
  getJapaneseSidebarTitle,
  type SupportedLocale,
} from '~/common/i18n';
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
    return (navigation.reference as Record<string, unknown>)[version] as NavigationRoute[];
  } else {
    return navigation[getPageSection(path)] as NavigationRoute[];
  }
};

export const isArchivePath = (path: string) => {
  return Utilities.pathStartsWith('archive', getCanonicalPath(path));
};

export const isInternalPath = (path: string) => {
  return Utilities.pathStartsWith('internal', getCanonicalPath(path));
};

export const isVersionedPath = (path: string) => {
  return Utilities.pathStartsWith('versions', getCanonicalPath(path));
};

export const isReferencePath = (path: string) => {
  const canonical = getCanonicalPath(path);
  return navigation.referenceDirectories.some(name => Utilities.pathStartsWith(name, canonical));
};

export const isHomePath = (path: string) => {
  const canonical = getCanonicalPath(path);
  return navigation.homeDirectories.some(name => Utilities.pathStartsWith(name, canonical));
};

export const isGeneralPath = (path: string) => {
  const canonical = getCanonicalPath(path);
  return navigation.generalDirectories.some(name => Utilities.pathStartsWith(name, canonical));
};

export const isFeaturePreviewPath = (path: string) => {
  const canonical = getCanonicalPath(path);
  return navigation.featurePreview.some(name => Utilities.pathStartsWith(name, canonical));
};

export const isPreviewPath = (path: string) => {
  const canonical = getCanonicalPath(path);
  return navigation.previewDirectories.some(name => Utilities.pathStartsWith(name, canonical));
};

export const isLearnPath = (path: string) => {
  const canonical = getCanonicalPath(path);
  return navigation.learnDirectories.some(name => Utilities.pathStartsWith(name, canonical));
};

export const isEasPath = (path: string) => {
  const canonical = getCanonicalPath(path);
  return navigation.easDirectories.some(name => Utilities.pathStartsWith(name, canonical));
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
  } else if (isEasPath(path)) {
    return 'eas';
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

export const getMarkdownPath = (asPath: string) => {
  const path = asPath.split('?')[0].split('#')[0];
  if (path === '' || path === '/') {
    return '/index.md';
  }
  const stripped = path.endsWith('/') ? path.slice(0, -1) : path;
  return stripped + '.md';
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

  const linkUrl = stripVersionFromPath(info?.as ?? info?.href);
  return linkUrl === stripVersionFromPath(pathname) || linkUrl === stripVersionFromPath(asPath);
};

const DOCS_ROOT = 'https://docs.expo.dev';

function getAncestorUrl(node: NavigationRoute): string {
  if (!node.children) {
    return DOCS_ROOT;
  }

  for (const child of node.children as NavigationRoute[]) {
    if (!child || child.hidden) {
      continue;
    }
    if (child.type === 'page' && child.href) {
      if (child.isIndex) {
        return `${DOCS_ROOT}${child.href}`;
      }
    }
    if (child.children) {
      const url = getAncestorUrl(child);
      if (url !== DOCS_ROOT) {
        return url;
      }
    }
  }
  return DOCS_ROOT;
}

export function getBreadcrumbTrail(
  routes: NavigationRoute[],
  pathname: string
): { name: string; url?: string }[] {
  const trail: { name: string; node: NavigationRoute }[] = [];

  function search(nodes: NavigationRoute[] | NavigationRouteWithSection[]): boolean {
    for (const node of nodes) {
      if (!node || node.hidden) {
        continue;
      }

      if (node.type === 'page') {
        if (node.href === pathname) {
          trail.push({ name: node.sidebarTitle ?? node.name, node });
          return true;
        }
      } else if (node.children) {
        trail.push({ name: node.name, node });
        if (search(node.children)) {
          return true;
        }
        trail.pop();
      }
    }
    return false;
  }

  search(routes);

  return trail
    .filter(item => item.name !== '')
    .map((item, index, filtered) => {
      const isLast = index === filtered.length - 1;
      if (isLast) {
        return { name: item.name };
      }

      const url =
        item.node.type === 'page' ? `${DOCS_ROOT}${item.node.href}` : getAncestorUrl(item.node);

      return { name: item.name, url };
    });
}

function isInternalHref(href?: string) {
  if (!href) {
    return false;
  }
  if (href.startsWith('http://') || href.startsWith('https://') || href.startsWith('//')) {
    return false;
  }
  return href.startsWith('/');
}

export function localizeRoutes<T extends NavigationRoute | NavigationRouteWithSection>(
  routes: T[],
  locale: SupportedLocale
): T[] {
  if (locale === 'en') {
    return routes;
  }
  return routes.map(route => localizeRoute(route, locale));
}

function localizeRoute<T extends NavigationRoute | NavigationRouteWithSection>(
  route: T,
  locale: SupportedLocale
): T {
  const next: T = { ...route };
  if (isInternalHref(next.href)) {
    next.href = buildLocalePath(next.href, locale);
  }
  if (isInternalHref(next.as)) {
    next.as = buildLocalePath(next.as as string, locale);
  }
  if (locale === 'ja' && next.type === 'page' && route.href) {
    const translatedTitle = getJapaneseSidebarTitle(route.href);
    if (translatedTitle) {
      next.name = translatedTitle;
      next.sidebarTitle = translatedTitle;
    }
  }
  if (locale === 'ja' && next.type !== 'page' && route.name) {
    const translatedSection = getJapaneseSectionTitle(route.name);
    if (translatedSection) {
      next.sidebarTitle = translatedSection;
    }
  }
  if (next.children) {
    next.children = next.children.map(child => localizeRoute(child, locale));
  }
  return next;
}

export function appendSectionToRoute(route?: NavigationRouteWithSection) {
  if (route?.children) {
    const sectionName = route.sidebarTitle ?? route.name;
    return route.children.map((entry: NavigationRouteWithSection) =>
      route.type !== 'page'
        ? Object.assign(entry, {
            section: route.section ? `${route.section} - ${sectionName}` : sectionName,
          })
        : route
    );
  }
  return route;
}
