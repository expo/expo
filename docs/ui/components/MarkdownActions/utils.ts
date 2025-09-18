const FRONTMATTER_PATTERN = /^---\n([\S\s]*?)\n---\n?/;
const IMPORT_STATEMENT_PATTERN = /^import\s.+$\n?/gm;
const BOX_LINK_PATTERN = /<BoxLink[\S\s]*?title="([^"]+)"[\S\s]*?href="([^"]+)"[\S\s]*?\/>/g;
const VIDEO_BOX_LINK_PATTERN = /<VideoBoxLink[\S\s]*?(?:\/>|>[\S\s]*?<\/VideoBoxLink>)/g;
const INTERNAL_LINK_PATTERN = /(?<=]\()(\/[^)]+)(?=\))/g;
const PRETTIER_IGNORE_PATTERN = /{\/\*\s*prettier-ignore\s*\*\/}/g;

const DYNAMIC_DATA_PATHS = [
  /^\/additional-resources\/?$/,
  /^\/eas\/json\/?$/,
  /^\/versions\/(?:latest|unversioned|v\d+\.\d+\.\d+)\/config\/app\/?$/,
];

export function normalizePath(path?: string) {
  if (!path) {
    return '';
  }

  const [cleanPath] = path.split('?');
  return cleanPath.replace(/\/+$/, '') || '/';
}

export function hasDynamicData(path?: string) {
  const normalized = normalizePath(path);
  return normalized ? DYNAMIC_DATA_PATHS.some(pattern => pattern.test(normalized)) : false;
}

export function shouldShowMarkdownActions({
  packageName,
  path,
}: {
  packageName?: string;
  path?: string;
}) {
  if (packageName) {
    return false;
  }

  return !hasDynamicData(path);
}

export function prepareMarkdownForCopy(rawContent: string) {
  if (!rawContent) {
    return '';
  }

  let content = rawContent;
  let title = '';
  let description = '';

  const frontmatterMatch = content.match(FRONTMATTER_PATTERN);
  if (frontmatterMatch) {
    const frontmatter = frontmatterMatch[1]
      .split('\n')
      .map(line => line.trim())
      .filter(Boolean);

    frontmatter.forEach(line => {
      const [rawKey, ...rawValueParts] = line.split(':');
      if (!rawKey || rawValueParts.length === 0) {
        return;
      }
      const key = rawKey.trim();
      const value = rawValueParts
        .join(':')
        .trim()
        .replace(/^["']|["']$/g, '');

      if (key === 'title') {
        title = value;
      }
      if (key === 'description') {
        description = value;
      }
    });

    content = content.slice(frontmatterMatch[0].length);
  }

  content = content.replace(IMPORT_STATEMENT_PATTERN, '');

  content = content.replace(BOX_LINK_PATTERN, (_match, linkTitle, href) => {
    const normalizedHref = href.startsWith('http') ? href : `https://docs.expo.dev${href}`;
    const markdownLink = `[${linkTitle}](${normalizedHref})`;
    return `\n${markdownLink}\n`;
  });

  content = content.replace(VIDEO_BOX_LINK_PATTERN, match => {
    const titleMatch = match.match(/title="([^"]+)"/);
    const videoIdMatch = match.match(/videoId="([^"]+)"/);

    if (!videoIdMatch) {
      return '';
    }

    const linkTitle = titleMatch ? titleMatch[1] : 'Watch video';
    const href = `https://www.youtube.com/watch?v=${videoIdMatch[1]}`;
    const markdownLink = `[${linkTitle}](${href})`;
    return `\n${markdownLink}\n`;
  });

  content = content.replace(INTERNAL_LINK_PATTERN, match => {
    if (match.startsWith('http')) {
      return match;
    }
    return `https://docs.expo.dev${match}`;
  });

  content = content.replace(PRETTIER_IGNORE_PATTERN, '');

  const cleaned = content
    .split('\n')
    .map(line => line.trimEnd())
    .join('\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();

  const parts = [] as string[];
  if (title) {
    parts.push(`# ${title}`);
  }
  if (description) {
    parts.push(`_${description}_`);
  }
  if (cleaned) {
    parts.push(cleaned);
  }

  return parts.join('\n\n');
}
