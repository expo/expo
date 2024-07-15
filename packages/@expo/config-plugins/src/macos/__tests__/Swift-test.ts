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
      vol.existsSync(path.join(projectRoot, 'macos/HelloWorld/HelloWorld-Bridging-Header.h'))
    ).toBe(true);
  });

  it(`skips creating a bridging header when using swift`, () => {
    const projectRoot = '/';
    vol.fromJSON(
      {
        'macos/HelloWorld.xcodeproj/project.pbxproj':
          rnFixture['macos/HelloWorld.xcodeproj/project.pbxproj'],
        'macos/HelloWorld/AppDelegate.swift': '',
      },
      projectRoot
    );
    const project = getPbxproj(projectRoot);
    // perform action
    ensureSwiftBridgingHeaderSetup({ projectRoot, project });

    // Won't link a bridging header
    expect(getDesignatedSwiftBridgingHeaderFileReference({ project })).toBe(null);

    expect(
      vol.existsSync(path.join(projectRoot, 'macos/HelloWorld/HelloWorld-Bridging-Header.h'))
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

    await compileModsAsync(config, { projectRoot: '/alpha', platforms: ['macos'] });
    expect(fs.existsSync('/alpha/macos/HelloWorld/noop-file.swift')).toBeTruthy();
  });
});
