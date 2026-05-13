const VCS_DIR_SEGMENT = /(?:^|[/\\])\.(?:git|hg)[/\\]/;

export default function isVcsPath(filePath: string): boolean {
  return VCS_DIR_SEGMENT.test(filePath);
}
