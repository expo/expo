/**
 * @description An alias for `string`, useful as a placeholder before typed routes
 * are generated in development. By using this to type routes instead of `string`,
 * you can ensure that your project remains compatible with typed routes in the
 * future.
 * @template T This type parameter can be ignored - it is only a stub
 * for compatibility with the typed route system.
 */ // eslint-disable-next-line @typescript-eslint/no-unused-vars
export type Route<T = any> = string;
/**
 * @description A string or object representing a route—and, optionally, its query parameters—when
 * not using typed routes (or before they are generated in development).
 * @template T This type parameter can be ignored - it is only a stub
 * for compatibility with the typed route system.
 */ // eslint-disable-next-line @typescript-eslint/no-unused-vars
export type Href<T = any> = Route | HrefObject;
/**
 * @description An object representing parsed query parameters when
 * not using typed routes (or before they are generated in development).
 * @template T This type parameter can be ignored - it is only a stub
 * for compatibility with the typed route system.
 */ // eslint-disable-next-line @typescript-eslint/no-unused-vars
export type SearchParams<T = any> = Record<string, (string | string | number)[]>;
/**
 * @description An object representing a route and its query parameters when
 * not using typed routes (or before they are generated in development).
 * @template T This type parameter can be ignored - it is only a stub
 * for compatibility with the typed route system.
 */ // eslint-disable-next-line @typescript-eslint/no-unused-vars
export interface HrefObject<T = any> {
  /** Path representing the selected route `/[id]`. */
  pathname?: string;
  /** Query parameters for the path. */
  params?: SearchParams<T>;
}

/** Resolve an href object into a fully qualified, relative href. */
export const resolveHref = (href: Href): string => {
  if (typeof href === 'string') {
    return resolveHref({ pathname: href ?? '' });
  }
  const path = href.pathname ?? '';
  if (!href?.params) {
    return path;
  }
  const { pathname, params } = createQualifiedPathname(path, {
    ...href.params,
  });
  const paramsString = createQueryParams(params);
  return pathname + (paramsString ? `?${paramsString}` : '');
};

function createQualifiedPathname(
  pathname: string,
  params: Record<string, any>
): Omit<Required<HrefObject>, 'query'> {
  for (const [key, value = ''] of Object.entries(params)) {
    const dynamicKey = `[${key}]`;
    const deepDynamicKey = `[...${key}]`;
    if (pathname.includes(dynamicKey)) {
      pathname = pathname.replace(dynamicKey, encodeParam(value));
    } else if (pathname.includes(deepDynamicKey)) {
      pathname = pathname.replace(deepDynamicKey, encodeParam(value));
    } else {
      continue;
    }

    delete params[key];
  }
  return { pathname, params };
}

function encodeParam(param: any): string {
  if (Array.isArray(param)) {
    return param.map((p) => encodeParam(p)).join('/');
  }

  return encodeURIComponent(param.toString());
}

function createQueryParams(params: Record<string, any>): string {
  return (
    Object.entries(params)
      // Allow nullish params
      .filter(([, value]) => value != null)
      .map(([key, value]) => `${key}=${encodeURIComponent(value.toString())}`)
      .join('&')
  );
}
