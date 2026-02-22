import { getPathDataFromState, type State } from '../fork/getPathFromState';
import { parseUrlUsingCustomBase } from '../utils/url';

export function generateStringUrlForState(state: State | undefined): string | undefined {
  if (!state) {
    return undefined;
  }
  const { path: rawPath, params: nonPathParams } = getPathDataFromState(state);
  const url = parseUrlUsingCustomBase(rawPath);

  for (const [key, value] of Object.entries(nonPathParams)) {
    url.searchParams.append(key, value);
  }

  return `${decodeURIComponent(url.pathname)}${url.search}`;
}

export function getPathAndParamsFromStringUrl(urlString: string) {
  const url = parseUrlUsingCustomBase(urlString);
  return {
    pathname: url.pathname,
    params: Object.fromEntries(url.searchParams.entries()),
  };
}
