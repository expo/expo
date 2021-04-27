import fs from 'fs';
import path from 'path';

import { modifyAppDelegate } from '../withDevLauncherAppDelegate';

describe(modifyAppDelegate, () => {
  it(`modifies the AppDelegate file for unimodules`, () => {
    const fixture = fs.readFileSync(
      path.join(__dirname, 'fixtures', 'AppDelegate-unimodules.m'),
      'utf8'
    );
    expect(modifyAppDelegate(fixture)).toMatchSnapshot();
  });
});
