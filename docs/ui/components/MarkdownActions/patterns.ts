export const FRONTMATTER_PATTERN = /^---\n([\S\s]*?)\n---\n?/;
export const IMPORT_STATEMENT_PATTERN = /^import\s.+$\n?/gm;
export const BOX_LINK_PATTERN = /<BoxLink[\S\s]*?title="([^"]+)"[\S\s]*?href="([^"]+)"[\S\s]*?\/>/g;
export const VIDEO_BOX_LINK_PATTERN = /<VideoBoxLink[\S\s]*?(?:\/>|>[\S\s]*?<\/VideoBoxLink>)/g;
export const INTERNAL_LINK_PATTERN = /(?<=]\()(\/[^)]+)(?=\))/g;
export const PRETTIER_IGNORE_PATTERN = /{\/\*\s*prettier-ignore\s*\*\/}/g;
