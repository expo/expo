const stringRe = /"(?:"|[^\r\n]*?[^\\]")/g;
const complexStringRe = /\\/g;

const maybeParseString = (match: string): string | null => {
  if (!complexStringRe.test(match)) {
    return match.slice(1, -1);
  }
  try {
    return JSON.parse(match);
  } catch {
    return null;
  }
};

const pathReplacePattern = /^(\/)?node_modules\/(\.pnpm\/[\w@+.-]+\/)?/g;

export function sanitizeRSCPayloadString(input: string): string {
  // TODO(@kitten): We currently don't parse the RSC payloads. We only sanitize the pnpm paths in them for now
  return input.replace(stringRe, (match) => {
    let str = maybeParseString(match);
    if (str) {
      // Account for optional leading slash
      str = str.replace(pathReplacePattern, (_match, prefix) => prefix || '');
      return JSON.stringify(str);
    } else {
      return match;
    }
  });
}
