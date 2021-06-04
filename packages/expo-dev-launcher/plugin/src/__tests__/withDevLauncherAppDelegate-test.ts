import fs from 'fs';
import path from 'path';

import { modifyAppDelegate } from '../withDevLauncherAppDelegate';

describe(modifyAppDelegate, () => {
  it(`modifies the AppDelegate file for dev-lanuncher`, () => {
    const fixture = fs.readFileSync(
      path.join(__dirname, 'fixtures', 'AppDelegate-unimodules.m'),
      'utf8'
    );
    expect(modifyAppDelegate(fixture, false)).toMatchSnapshot();
  });
});

describe(modifyAppDelegate, () => {
  it(`modifies the AppDelegate file for dev-launcher with updates`, () => {
    const fixture = fs.readFileSync(
      path.join(__dirname, 'fixtures', 'AppDelegate-unimodules.m'),
      'utf8'
    );
    expect(modifyAppDelegate(fixture, true)).toMatchSnapshot();
  });
});
