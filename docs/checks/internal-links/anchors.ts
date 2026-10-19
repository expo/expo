import type * as cheerio from 'cheerio';

function safeDecode(value: string): string {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}

export function collectIds($: cheerio.CheerioAPI): Set<string> {
  const ids = new Set<string>();
  $('[id]').each((_, element) => {
    ids.add($(element).attr('id')!);
  });
  return ids;
}

export function hasAnchor(
  idsByPage: Map<string, Set<string>>,
  target: string,
  hash: string
): boolean {
  const ids = idsByPage.get(target);
  if (!ids) {
    return false;
  }
  return ids.has(hash) || ids.has(safeDecode(hash));
}
