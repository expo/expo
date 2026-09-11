/**
 * Swift Testing modules ship with the toolchain, not with the SDK, so an app that links a
 * prebuilt framework cannot resolve them. Any of them reaching a shipped `.swiftinterface`
 * means unit tests were compiled into the framework.
 */
const TEST_ONLY_IMPORT_REGEX =
  /^[ \t]*(?:@\w+(?:\([^)]*\))?[ \t]+)*(?:public|package|internal)?[ \t]*import[ \t]+(Testing|_Testing_\w+)\b/;

/**
 * Returns the test-only modules imported by a `.swiftinterface`, in order of first appearance.
 */
export function findTestOnlyImports(interfaceContents: string): string[] {
  const modules = new Set<string>();
  for (const line of interfaceContents.split('\n')) {
    const match = line.match(TEST_ONLY_IMPORT_REGEX);
    if (match) {
      modules.add(match[1]);
    }
  }
  return [...modules];
}
