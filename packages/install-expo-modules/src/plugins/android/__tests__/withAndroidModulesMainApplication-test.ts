import fs from 'fs';
import path from 'path';

import { setModulesMainApplication } from '../withAndroidModulesMainApplication';

const fixturesPath = path.resolve(__dirname, 'fixtures');

describe(setModulesMainApplication, () => {
  it('should able to update from react-native@>=0.71.0 template', async () => {
    const [rawContents, expectContents] = await Promise.all([
      fs.promises.readFile(path.join(fixturesPath, 'MainApplication-rn071.java'), 'utf8'),
      fs.promises.readFile(path.join(fixturesPath, 'MainApplication-rn071-updated.java'), 'utf8'),
    ]);

    const contents = setModulesMainApplication(rawContents, 'java');
    expect(contents).toEqual(expectContents);
    // Try it twice...
    const nextContents = setModulesMainApplication(contents, 'java');
    expect(nextContents).toEqual(expectContents);
  });

  it('should able to update from react-native@>=0.68.0 template', async () => {
    const [rawContents, expectContents] = await Promise.all([
      fs.promises.readFile(path.join(fixturesPath, 'MainApplication-rn068.java'), 'utf8'),
      fs.promises.readFile(path.join(fixturesPath, 'MainApplication-rn068-updated.java'), 'utf8'),
    ]);

    const contents = setModulesMainApplication(rawContents, 'java');
    expect(contents).toEqual(expectContents);
    // Try it twice...
    const nextContents = setModulesMainApplication(contents, 'java');
    expect(nextContents).toEqual(expectContents);
  });

  it('should able to update from react-native@<0.68.0 template', async () => {
    const [rawContents, expectContents] = await Promise.all([
      fs.promises.readFile(path.join(fixturesPath, 'MainApplication-rn064.java'), 'utf8'),
      fs.promises.readFile(path.join(fixturesPath, 'MainApplication-rn064-updated.java'), 'utf8'),
    ]);

    const contents = setModulesMainApplication(rawContents, 'java');
    expect(contents).toEqual(expectContents);
    // Try it twice...
    const nextContents = setModulesMainApplication(contents, 'java');
    expect(nextContents).toEqual(expectContents);
  });

  it('should support another manually modified kotlin version MainApplication', async () => {
    const [rawContents, expectContents] = await Promise.all([
      fs.promises.readFile(path.join(fixturesPath, 'MainApplication-rn064.kt'), 'utf8'),
      fs.promises.readFile(path.join(fixturesPath, 'MainApplication-rn064-updated.kt'), 'utf8'),
    ]);

    const contents = setModulesMainApplication(rawContents, 'kt');
    expect(contents).toEqual(expectContents);
    // Try it twice...
    const nextContents = setModulesMainApplication(contents, 'kt');
    expect(nextContents).toEqual(expectContents);
  });
});
