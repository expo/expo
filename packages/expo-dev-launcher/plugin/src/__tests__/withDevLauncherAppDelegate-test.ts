import fs from 'fs';
import path from 'path';

import { modifyAppDelegate } from '../withDevLauncherAppDelegate';

describe(modifyAppDelegate, () => {
  it(`modifies the AppDelegate file for dev-lanuncher`, () => {
    const fixture = fs.readFileSync(
      path.join(__dirname, 'fixtures', 'AppDelegate-unimodules.m'),
      'utf8'
    );
    expect(modifyAppDelegate(fixture, null)).toMatchSnapshot();
  });
});

describe(modifyAppDelegate, () => {
  it(`modifies the AppDelegate file for dev-launcher with incompatible updates`, () => {
    const fixture = fs.readFileSync(
      path.join(__dirname, 'fixtures', 'AppDelegate-unimodules.m'),
      'utf8'
    );
    expect(modifyAppDelegate(fixture, '0.5.4')).toMatchSnapshot();
  });
});

describe(modifyAppDelegate, () => {
  it(`modifies the AppDelegate file for dev-launcher with compatible updates`, () => {
    const fixture = fs.readFileSync(
      path.join(__dirname, 'fixtures', 'AppDelegate-unimodules.m'),
      'utf8'
    );
    expect(modifyAppDelegate(fixture, '0.7.0')).toMatchSnapshot();
  });
});
