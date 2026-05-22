const EXCLUDED_DIR_SEGMENT = /(?:^|[/\\])\.(?:git|hg|cxx)[/\\]/;

export default function isWatcherExcluded(filePath: string): boolean {
  return EXCLUDED_DIR_SEGMENT.test(filePath);
}
