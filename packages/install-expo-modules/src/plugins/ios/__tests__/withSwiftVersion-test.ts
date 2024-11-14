import fs from 'fs';
import path from 'path';
import { build as xcbuild, parse as xcparse } from 'xcparse';

import { setSwiftVersionIfNotPresent } from '../withSwiftVersion';

const fixturesPath = path.resolve(__dirname, 'fixtures');

it(
  "given targets in pbxproj that don't have `SWIFT_VERSION` build config specified, " +
    'setSwiftVersionIfNotPresent() sets it',
  async () => {
    const content = await fs.promises.readFile(
      path.join(fixturesPath, 'TestTargetsDontHaveSwiftVersion.pbxproj'),
      'utf8'
    );

    const project = xcparse(content);

    setSwiftVersionIfNotPresent('5.0', { project });

    const expectContents = await fs.promises.readFile(
      path.join(fixturesPath, 'TestTargetsDontHaveSwiftVersion-updated.pbxproj'),
      'utf8'
    );
    expect(expectContents).toEqual(xcbuild(project));
  }
);
