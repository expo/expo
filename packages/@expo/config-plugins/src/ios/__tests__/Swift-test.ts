import * as fs from 'fs';
import { vol } from 'memfs';
import * as path from 'path';

import rnFixture from '../../plugins/__tests__/fixtures/react-native-project';
import { compileModsAsync } from '../../plugins/mod-compiler';
import {
  ensureSwiftBridgingHeaderSetup,
  getDesignatedSwiftBridgingHeaderFileReference,
  withNoopSwiftFile,
} from '../Swift';
import { getPbxproj } from '../utils/Xcodeproj';

jest.mock('fs');

describe(ensureSwiftBridgingHeaderSetup, () => {
  afterEach(() => {
    vol.reset();
  });

  it(`creates a bridging header when none are designated`, () => {
    const projectRoot = '/';
    vol.fromJSON(rnFixture, projectRoot);
    const project = getPbxproj(projectRoot);
    // perform action
    ensureSwiftBridgingHeaderSetup({ projectRoot, project });

    expect(getDesignatedSwiftBridgingHeaderFileReference({ project })).toBe(
      'HelloWorld/HelloWorld-Bridging-Header.h'
    );

    expect(
      vol.existsSync(path.join(projectRoot, 'ios/HelloWorld/HelloWorld-Bridging-Header.h'))
    ).toBe(true);
  });

  it(`skips creating a bridging header when using swift`, () => {
    const projectRoot = '/';
    vol.fromJSON(
      {
        'ios/HelloWorld.xcodeproj/project.pbxproj':
          rnFixture['ios/HelloWorld.xcodeproj/project.pbxproj'],
        'ios/HelloWorld/AppDelegate.swift': '',
      },
      projectRoot
    );
    const project = getPbxproj(projectRoot);
    // perform action
    ensureSwiftBridgingHeaderSetup({ projectRoot, project });

    // Won't link a bridging header
    expect(getDesignatedSwiftBridgingHeaderFileReference({ project })).toBe(null);

    console.log('jj', Object.keys(vol.toJSON()));
    expect(
      vol.existsSync(path.join(projectRoot, 'ios/HelloWorld/HelloWorld-Bridging-Header.h'))
    ).toBe(false);
  });
});

describe(withNoopSwiftFile, () => {
  afterEach(() => {
    vol.reset();
  });

  it(`creates a noop swift file`, async () => {
    const projectRoot = '/alpha';
    vol.fromJSON(rnFixture, projectRoot);
    const config = withNoopSwiftFile({
      name: 'testproject',
      slug: 'testproject',
    });

    await compileModsAsync(config, { projectRoot: '/alpha', platforms: ['ios'] });
    expect(fs.existsSync('/alpha/ios/HelloWorld/noop-file.swift')).toBeTruthy();
  });
});
