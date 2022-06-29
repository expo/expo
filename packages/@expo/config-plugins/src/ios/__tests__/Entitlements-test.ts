import plist from '@expo/plist';
import * as fs from 'fs';
import { vol } from 'memfs';
import * as path from 'path';

import {
  ensureApplicationTargetEntitlementsFileConfigured,
  getEntitlementsPath,
} from '../Entitlements';

const fsReal = jest.requireActual('fs') as typeof fs;

jest.mock('fs');

const exampleEntitlements = `<?xml version="0.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
	<key>special</key>
	<true/>
</dict>
</plist>`;

describe(ensureApplicationTargetEntitlementsFileConfigured, () => {
  const projectRoot = '/app';

  afterEach(() => {
    vol.reset();
  });

  it('creates a new entitlements file when none exists', async () => {
    vol.fromJSON(
      {
        'ios/testproject.xcodeproj/project.pbxproj': fsReal.readFileSync(
          path.join(__dirname, 'fixtures/project.pbxproj'),
          'utf-8'
        ),
        'ios/testproject/AppDelegate.m': '',
      },
      projectRoot
    );
    const entitlementsPathBefore = getEntitlementsPath(projectRoot);
    ensureApplicationTargetEntitlementsFileConfigured(projectRoot);
    const entitlementsPath = getEntitlementsPath(projectRoot);
    expect(entitlementsPathBefore).toBeNull();
    expect(entitlementsPath).toBe('/app/ios/testproject/testproject.entitlements');

    // New file has the contents of the old entitlements file
    const data = plist.parse(await fs.promises.readFile(entitlementsPath, 'utf8'));
    expect(data).toStrictEqual({
      // No entitlements enabled by default
    });
  });

  it('creates a new entitlements file if file in XCBuildConfiguration does not exists', async () => {
    vol.fromJSON(
      {
        'ios/testproject.xcodeproj/project.pbxproj': fsReal.readFileSync(
          path.join(__dirname, 'fixtures/project-with-entitlements.pbxproj'),
          'utf-8'
        ),
        'ios/testproject/AppDelegate.m': '',
      },
      projectRoot
    );
    ensureApplicationTargetEntitlementsFileConfigured(projectRoot);
    const entitlementsPath = getEntitlementsPath(projectRoot);
    expect(entitlementsPath).toBe('/app/ios/testproject/testproject.entitlements');

    // New file has the contents of the old entitlements file
    const data = plist.parse(await fs.promises.readFile(entitlementsPath, 'utf8'));
    expect(data).toStrictEqual({});
  });

  it('does not create any entitlements files if it already exists', async () => {
    vol.fromJSON(
      {
        'ios/testproject.xcodeproj/project.pbxproj': fsReal.readFileSync(
          path.join(__dirname, 'fixtures/project-with-entitlements.pbxproj'),
          'utf-8'
        ),
        'ios/testapp/example.entitlements': exampleEntitlements,
        'ios/testproject/AppDelegate.m': '',
      },
      projectRoot
    );
    ensureApplicationTargetEntitlementsFileConfigured(projectRoot);
    const entitlementsPath = getEntitlementsPath(projectRoot);
    expect(entitlementsPath).toBe('/app/ios/testapp/example.entitlements');

    // New file has the contents of the old entitlements file
    const data = plist.parse(await fs.promises.readFile(entitlementsPath, 'utf8'));
    expect(data).toStrictEqual({ special: true });

    // entitlement file in default location does not exist
    expect(fs.existsSync('/app/ios/testproject/testproject.entitlements')).toBe(false);
  });
});

describe(getEntitlementsPath, () => {
  const projectRoot = '/app';

  afterEach(() => {
    vol.reset();
  });

  it('returns null if CODE_SIGN_ENTITLEMENTS is not specified', async () => {
    vol.fromJSON(
      {
        'ios/testproject.xcodeproj/project.pbxproj': fsReal.readFileSync(
          path.join(__dirname, 'fixtures/project.pbxproj'),
          'utf-8'
        ),
        'ios/testproject/AppDelegate.m': '',
      },
      projectRoot
    );

    const entitlementsPath = getEntitlementsPath(projectRoot);
    expect(entitlementsPath).toBeNull();
  });
  it('returns path if CODE_SIGN_ENTITLEMENTS is specified and file exists', async () => {
    vol.fromJSON(
      {
        'ios/testproject.xcodeproj/project.pbxproj': fsReal.readFileSync(
          path.join(__dirname, 'fixtures/project-with-entitlements.pbxproj'),
          'utf-8'
        ),
        'ios/testapp/example.entitlements': exampleEntitlements,
        'ios/testproject/AppDelegate.m': '',
      },
      projectRoot
    );

    const entitlementsPath = getEntitlementsPath(projectRoot);
    expect(entitlementsPath).toBe('/app/ios/testapp/example.entitlements');
  });
});
