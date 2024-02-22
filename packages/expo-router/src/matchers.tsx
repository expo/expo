/** Match `[page]` -> `page` */
export function matchDynamicName(name: string): string | undefined {
  // Don't match `...` or `[` or `]` inside the brackets
  // eslint-disable-next-line no-useless-escape
  return name.match(/^\[([^[\](?:\.\.\.)]+?)\]$/)?.[1];
}

/** Match `[...page]` -> `page` */
export function matchDeepDynamicRouteName(name: string): string | undefined {
  return name.match(/^\[\.\.\.([^/]+?)\]$/)?.[1];
}

/** Test `/` -> `page` */
export function testNotFound(name: string): boolean {
  return /\+not-found$/.test(name);
}

/** Match `(page)` -> `page` */
export function matchGroupName(name: string): string | undefined {
  return name.match(/^(?:[^\\(\\)])*?\(([^\\/]+)\).*?$/)?.[1];
}

/** Match `(a,b,c)/(d,c)` -> `[['a','b','c'], ['d','e']]` */
export function matchArrayGroupName(name: string) {
  return name.match(/\(\s*\w[\w\s]*?,.*?\)/g)?.map((match) => match.slice(1, -1));
}

export function getNameFromFilePath(name: string): string {
  return removeSupportedExtensions(removeFileSystemDots(name));
}

export function getContextKey(name: string): string {
  // The root path is `` (empty string) so always prepend `/` to ensure
  // there is some value.
  const normal = '/' + getNameFromFilePath(name);
  if (!normal.endsWith('_layout')) {
    return normal;
  }
  return normal.replace(/\/?_layout$/, '');
}

/** Remove `.js`, `.ts`, `.jsx`, `.tsx` */
export function removeSupportedExtensions(name: string): string {
  return name.replace(/(\+api)?\.[jt]sx?$/g, '');
}

// Remove any amount of `./` and `../` from the start of the string
export function removeFileSystemDots(filePath: string): string {
  return filePath.replace(/^(?:\.\.?\/)+/g, '');
}

export function stripGroupSegmentsFromPath(path: string): string {
  return path
    .split('/')
    .reduce((acc, v) => {
      if (matchGroupName(v) == null) {
        acc.push(v);
      }
      return acc;
    }, [] as string[])
    .join('/');
}

export function stripInvisibleSegmentsFromPath(path: string): string {
  return stripGroupSegmentsFromPath(path).replace(/\/?index$/, '');
}

/**
 * Match:
 *  - _layout files, +html, +not-found, string+api, etc
 *  - Routes can still use `+`, but it cannot be in the last segment.
 */
export function isTypedRoute(name: string) {
  return !name.startsWith('+') && name.match(/(_layout|[^/]*?\+[^/]*?)\.[tj]sx?$/) === null;
}
