import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

import { resolveBuildConfigIos } from '../config';

let tmpDir: string;
let cwd: string;

beforeEach(() => {
  tmpDir = fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(), 'brownfield-config-')));
  fs.mkdirSync(path.join(tmpDir, 'ios'));
  cwd = process.cwd();
  process.chdir(tmpDir);
});

afterEach(() => {
  process.chdir(cwd);
  fs.rmSync(tmpDir, { recursive: true, force: true });
});

const resolve = (podfile: string) => {
  fs.writeFileSync(path.join(tmpDir, 'ios/Podfile'), podfile);
  return resolveBuildConfigIos({ scheme: 'MyKit', xcworkspace: 'ios/App.xcworkspace' });
};

describe('resolveBuildConfigIos', () => {
  it('uses iOS destinations and product directories for an iOS Podfile', () => {
    const config = resolve("platform :ios, '15.1'\n");
    expect(config.destinations).toEqual([
      'generic/platform=iphoneos',
      'generic/platform=iphonesimulator',
    ]);
    expect(config.device).toBe(path.join(tmpDir, 'ios/build/Build/Products/release-iphoneos'));
    expect(config.simulator).toBe(
      path.join(tmpDir, 'ios/build/Build/Products/release-iphonesimulator')
    );
  });

  it('uses tvOS destinations and product directories for a tvOS Podfile', () => {
    const config = resolve("platform :tvos, '15.1'\n");
    expect(config.destinations).toEqual([
      'generic/platform=tvOS',
      'generic/platform=tvOS Simulator',
    ]);
    expect(config.device).toBe(path.join(tmpDir, 'ios/build/Build/Products/release-appletvos'));
    expect(config.simulator).toBe(
      path.join(tmpDir, 'ios/build/Build/Products/release-appletvsimulator')
    );
  });
});
