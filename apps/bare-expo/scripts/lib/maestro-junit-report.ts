import * as path from 'path';

/**
 * Maps failed testcases from a Maestro JUnit report back to the flow files that produced them.
 *
 * Maestro reports each flow under its file name without the extension (e.g.
 * `expo-video/playback-test.yaml` shows up as `playback-test`), so the given flow paths must
 * have unique base names. Returns the failed flow paths in report order.
 */
export function getFailedFlowsFromJUnitReport(
  reportContents: string,
  flowRelativePaths: string[]
): string[] {
  const flowsByName = new Map<string, string>();
  for (const flowRelativePath of flowRelativePaths) {
    const flowName = path.basename(flowRelativePath, '.yaml');
    const existingFlow = flowsByName.get(flowName);
    if (existingFlow != null) {
      throw new Error(
        `Flows '${existingFlow}' and '${flowRelativePath}' would both report as '${flowName}'. ` +
          `Rename one of them so that Maestro results can be mapped back to flow files.`
      );
    }
    flowsByName.set(flowName, flowRelativePath);
  }

  const failedFlows: string[] = [];
  for (const [, testcase] of reportContents.matchAll(/<testcase\b([^>]*)>/g)) {
    const name = testcase.match(/\bname="([^"]*)"/)?.[1];
    const status = testcase.match(/\bstatus="([^"]*)"/)?.[1];
    if (name == null || status === 'SUCCESS') {
      continue;
    }
    const flowRelativePath = flowsByName.get(name);
    if (flowRelativePath == null) {
      throw new Error(
        `The Maestro report contains a failed flow '${name}' that doesn't match any of the ` +
          `flows passed to this run: ${flowRelativePaths.join(', ')}`
      );
    }
    failedFlows.push(flowRelativePath);
  }
  return failedFlows;
}
