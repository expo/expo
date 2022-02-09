import navigation from '~/constants/navigation';

// TODO(cedric): refactor the documentation header page to handle this logic itself

function isReferencePath(pathname: string) {
  return pathname.startsWith('/versions');
}

function isGeneralPath(pathname: string) {
  return navigation.generalDirectories.some(name => pathname.startsWith(`/${name}`));
}

function isGettingStartedPath(pathname: string) {
  return (
    pathname === '/' || navigation.startingDirectories.some(name => pathname.startsWith(`/${name}`))
  );
}

function isFeaturePreviewPath(pathname: string) {
  return navigation.featurePreviewDirectories.some(name => pathname.startsWith(`/${name}`));
}

function isPreviewPath(pathname: string) {
  return navigation.previewDirectories.some(name => pathname.startsWith(`/${name}`));
}

function isEasPath(pathname: string) {
  return navigation.easDirectories.some(name => pathname.startsWith(`/${name}`));
}

export function getActiveSection(pathname: string) {
  if (isReferencePath(pathname)) {
    return 'reference';
  } else if (isGeneralPath(pathname)) {
    return 'general';
  } else if (isGettingStartedPath(pathname)) {
    return 'starting';
  } else if (isFeaturePreviewPath(pathname)) {
    return 'featurePreview';
  } else if (isPreviewPath(pathname)) {
    return 'preview';
  } else if (isEasPath(pathname)) {
    return 'eas';
  }

  return 'general';
}

export function getRoutes(pathname: string, version?: string) {
  if (isReferencePath(pathname)) {
    return navigation.reference[version as any];
  } else {
    return navigation[getActiveSection(pathname)];
  }
}
