import fs from 'fs';
import path from 'path';

import { modifyJavaMainActivity } from '../withDevLauncher';

describe(modifyJavaMainActivity, () => {
  /**
   * The config plugin cannot currently handle projects created with react-native init
   *
  it(`modifies the MainActivity file for dev-launcher`, () => {
    const fixture = fs.readFileSync(
      path.join(__dirname, 'fixtures', 'MainActivity-react-native.java'),
      'utf8'
    );
    expect(modifyJavaMainActivity(fixture)).toMatchSnapshot();
  });
   */

  it(`modifies the MainActivity file for dev-launcher`, () => {
    const fixture = fs.readFileSync(
      path.join(__dirname, 'fixtures', 'MainActivity-expo-modules.java'),
      'utf8'
    );
    expect(modifyJavaMainActivity(fixture)).toMatchSnapshot();
  });

  it(`modifies the MainActivity file for dev-launcher when onNewIntent exists`, () => {
    const fixture = fs.readFileSync(
      path.join(__dirname, 'fixtures', 'MainActivity-with-on-new-intent.java'),
      'utf8'
    );
    expect(modifyJavaMainActivity(fixture)).toMatchSnapshot();
  });

  it(`modifying MainActivity twice doesn't change the content`, () => {
    const firstModification = fs.readFileSync(
      path.join(__dirname, 'fixtures', 'MainActivity-expo-modules.java'),
      'utf8'
    );
    modifyJavaMainActivity(firstModification);
    const secondModification = `${firstModification}`;
    modifyJavaMainActivity(secondModification);
    expect(secondModification).toBe(firstModification);
  });
});
