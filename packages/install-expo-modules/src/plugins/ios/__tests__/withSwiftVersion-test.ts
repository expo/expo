import fs from 'fs';
import path from 'path';
import xcode from 'xcode';

import { setSwiftVersionIfNotPresent } from '../withSwiftVersion';

const fixturesPath = path.resolve(__dirname, 'fixtures');

it(
  "given targets in pbxproj that don't have `SWIFT_VERSION` build config specified, " +
    'setSwiftVersionIfNotPresent() sets it',
  async () => {
    const project = xcode.project(
      path.join(fixturesPath, 'TestTargetsDontHaveSwiftVersion.pbxproj')
    );
    project.parseSync();

    setSwiftVersionIfNotPresent('5.0', { project });

    const expectContents = await fs.promises.readFile(
      path.join(fixturesPath, 'TestTargetsDontHaveSwiftVersion-updated.pbxproj'),
      'utf8'
    );
    expect(expectContents).toEqual(project.writeSync());
  }
);
