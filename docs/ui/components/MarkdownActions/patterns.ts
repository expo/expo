export const FRONTMATTER_PATTERN = /^---\n([\S\s]*?)\n---\n?/;
export const VIDEO_BOX_LINK_PATTERN = /<VideoBoxLink[\S\s]*?(?:\/>|>[\S\s]*?<\/VideoBoxLink>)/g;
export const INTERNAL_LINK_PATTERN = /(?<=]\()(\/[^)]+)(?=\))/g;
export const PRETTIER_IGNORE_PATTERN = /{\/\*\s*prettier-ignore\s*\*\/}/g;
