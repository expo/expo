type CacheOutputData = {
  skipCache?: boolean;
  css?: {
    skipCache?: boolean;
  };
};

export function shouldSkipCache(value: unknown): boolean {
  const output = (value as { output?: unknown } | null)?.output;
  if (!Array.isArray(output)) {
    return false;
  }
  return output.some(
    (item: { data?: CacheOutputData }) => !!(item?.data?.skipCache || item?.data?.css?.skipCache)
  );
}
