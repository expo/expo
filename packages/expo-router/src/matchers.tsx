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

/** Match `(page)` -> `page` */
export function matchGroupName(name: string): string | undefined {
  return name.match(/^(?:[^\\(\\)])*?\(([^\\/]+)\).*?$/)?.[1];
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
