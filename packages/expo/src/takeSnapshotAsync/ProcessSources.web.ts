import {
  isDataUrl,
  getMimeTypeFromSource,
  getEscapedString,
  resolveUrl,
  getSourceAndEncodeAsync,
  formatDataAsUrl,
} from './Utils.web';

const URL_REGEX = /url\(['"]?([^'"]+?)['"]?\)/g;

export function shouldProcess(string: string): boolean {
  if (!string.search) {
    return false;
  }
  return string.search(URL_REGEX) !== -1;
}

export async function batchProcessAllSourcesAsync(
  string: string,
  baseUrl?: string,
  get?
): Promise<string> {
  if (!shouldProcess(string)) {
    return string;
  }

  const urls = readURLs(string);

  let done = Promise.resolve(string);
  for (const url of urls) {
    done = done.then(string => processURLAsync(string, url, baseUrl, get));
  }
  return done;
}

function readURLs(urls: string): any[] {
  const result: any[] = [];
  let match;
  while ((match = URL_REGEX.exec(urls)) !== null) {
    result.push(match[1]);
  }
  return result.filter(url => !isDataUrl(url));
}

type SourceHandler = (value: string) => Promise<string>;

async function processURLAsync(
  string: string,
  url: string,
  baseUrl: string | undefined = undefined,
  getSourceAsync: SourceHandler = getSourceAndEncodeAsync
): Promise<string> {
  const finalURL = baseUrl ? resolveUrl(url, baseUrl) : url;
  const data = await getSourceAsync(finalURL);
  const dataUrl = formatDataAsUrl(data, getMimeTypeFromSource(url));

  return string.replace(URLAsRegex(url), `$1${dataUrl}$3`);
}

function URLAsRegex(url) {
  return new RegExp(`(url\\(['"]?)(${getEscapedString(url)})(['"]?\\))`, 'g');
}
