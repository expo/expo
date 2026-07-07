import { describe, expect, it } from 'bun:test';

import { getFailedFlowsFromJUnitReport } from './maestro-junit-report';

function makeReport(testcases: string): string {
  return `<?xml version='1.0' encoding='UTF-8'?>
<testsuites>
  <testsuite name="Test Suite" device="iPhone 17 Pro - iOS 26.0 - 0000" tests="3" failures="1" time="2.0">
${testcases}
  </testsuite>
</testsuites>`;
}

describe(getFailedFlowsFromJUnitReport, () => {
  it('returns an empty array when all flows passed', () => {
    const report = makeReport(`
    <testcase id="confirm-app-open" name="confirm-app-open" classname="confirm-app-open" time="1.0" status="SUCCESS"/>
    <testcase id="test" name="test" classname="test" time="1.0" status="SUCCESS"/>
`);
    const flows = ['_nested-flows/confirm-app-open.yaml', 'expo-image/test.yaml'];

    expect(getFailedFlowsFromJUnitReport(report, flows)).toEqual([]);
  });

  it('maps failed testcases back to flow paths', () => {
    const report = makeReport(`
    <testcase id="confirm-app-open" name="confirm-app-open" classname="confirm-app-open" time="1.0" status="SUCCESS"/>
    <testcase id="fullscreen-test" name="fullscreen-test" classname="fullscreen-test" time="1.0" status="ERROR">
      <failure>Assertion is false: false is true</failure>
    </testcase>
    <testcase id="player-output-test" name="player-output-test" classname="player-output-test" time="0.0" status="ERROR">
      <failure>Element not found</failure>
    </testcase>
`);
    const flows = [
      '_nested-flows/confirm-app-open.yaml',
      'expo-video/fullscreen-test.yaml',
      'expo-video/player-output-test.yaml',
    ];

    expect(getFailedFlowsFromJUnitReport(report, flows)).toEqual([
      'expo-video/fullscreen-test.yaml',
      'expo-video/player-output-test.yaml',
    ]);
  });

  it('matches platform-suffixed flow file names', () => {
    const report = makeReport(`
    <testcase id="picture-in-picture-test.android" name="picture-in-picture-test.android" classname="picture-in-picture-test.android" time="1.0" status="ERROR">
      <failure>Element not found</failure>
    </testcase>
`);
    const flows = ['expo-video/picture-in-picture-test.android.yaml'];

    expect(getFailedFlowsFromJUnitReport(report, flows)).toEqual([
      'expo-video/picture-in-picture-test.android.yaml',
    ]);
  });

  it('treats any non-SUCCESS status as a failure', () => {
    const report = makeReport(`
    <testcase id="playback-test" name="playback-test" classname="playback-test" time="1.0" status="WARNING"/>
`);
    const flows = ['expo-video/playback-test.yaml'];

    expect(getFailedFlowsFromJUnitReport(report, flows)).toEqual(['expo-video/playback-test.yaml']);
  });

  it('returns an empty array for a report without testcases', () => {
    const report = `<?xml version='1.0' encoding='UTF-8'?>
<testsuites>
  <testsuite name="Test Suite" tests="0" failures="0" time="0.0"/>
</testsuites>`;

    expect(getFailedFlowsFromJUnitReport(report, ['expo-image/test.yaml'])).toEqual([]);
  });

  it('throws when a failed testcase does not match any flow', () => {
    const report = makeReport(`
    <testcase id="unknown-flow" name="unknown-flow" classname="unknown-flow" time="1.0" status="ERROR">
      <failure>boom</failure>
    </testcase>
`);
    const flows = ['expo-image/test.yaml'];

    expect(() => getFailedFlowsFromJUnitReport(report, flows)).toThrow('unknown-flow');
  });

  it('throws when two flows would report under the same name', () => {
    const report = makeReport(`
    <testcase id="test" name="test" classname="test" time="1.0" status="SUCCESS"/>
`);
    const flows = ['expo-image/test.yaml', 'expo-video/test.yaml'];

    expect(() => getFailedFlowsFromJUnitReport(report, flows)).toThrow('expo-video/test.yaml');
  });
});
