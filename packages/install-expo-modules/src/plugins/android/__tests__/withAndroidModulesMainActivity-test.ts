import fs from 'fs';
import path from 'path';

import { setModulesMainActivity } from '../withAndroidModulesMainActivity';

const fixturesPath = path.resolve(__dirname, 'fixtures');

describe(setModulesMainActivity, () => {
  it(`should add createReactActivityDelegate code block if not overridden yet - java`, async () => {
    const [rawContents, expectContents] = await Promise.all([
      fs.promises.readFile(path.join(fixturesPath, 'MainActivity-no-delegate.java'), 'utf8'),
      fs.promises.readFile(
        path.join(fixturesPath, 'MainActivity-no-delegate-updated.java'),
        'utf8'
      ),
    ]);

    const contents = setModulesMainActivity(rawContents, 'java');
    expect(contents).toEqual(expectContents);
    // Try it twice...
    const nextContents = setModulesMainActivity(contents, 'java');
    expect(nextContents).toEqual(expectContents);
  });

  it(`should add createReactActivityDelegate code block if not overridden yet - kotlin`, async () => {
    const [rawContents, expectContents] = await Promise.all([
      fs.promises.readFile(path.join(fixturesPath, 'MainActivity-no-delegate.kt'), 'utf8'),
      fs.promises.readFile(path.join(fixturesPath, 'MainActivity-no-delegate-updated.kt'), 'utf8'),
    ]);

    const contents = setModulesMainActivity(rawContents, 'kt');
    expect(contents).toEqual(expectContents);
    // Try it twice...
    const nextContents = setModulesMainActivity(contents, 'kt');
    expect(nextContents).toEqual(expectContents);
  });

  it(`should add ReactActivityDelegateWrapper for react-native@>=0.71.0 - java`, async () => {
    const [rawContents, expectContents] = await Promise.all([
      fs.promises.readFile(path.join(fixturesPath, 'MainActivity-rn071.java'), 'utf8'),
      fs.promises.readFile(path.join(fixturesPath, 'MainActivity-rn071-updated.java'), 'utf8'),
    ]);

    const contents = setModulesMainActivity(rawContents, 'java');
    expect(contents).toEqual(expectContents);
    // Try it twice...
    const nextContents = setModulesMainActivity(contents, 'java');
    expect(nextContents).toEqual(expectContents);
  });

  it(`should add ReactActivityDelegateWrapper for react-native@>=0.71.0 - kotlin`, async () => {
    const [rawContents, expectContents] = await Promise.all([
      fs.promises.readFile(path.join(fixturesPath, 'MainActivity-rn071.kt'), 'utf8'),
      fs.promises.readFile(path.join(fixturesPath, 'MainActivity-rn071-updated.kt'), 'utf8'),
    ]);

    const contents = setModulesMainActivity(rawContents, 'kt');
    expect(contents).toEqual(expectContents);
    // Try it twice...
    const nextContents = setModulesMainActivity(contents, 'kt');
    expect(nextContents).toEqual(expectContents);
  });

  it(`should add ReactActivityDelegateWrapper for react-native@>=0.68.0 - java`, async () => {
    const [rawContents, expectContents] = await Promise.all([
      fs.promises.readFile(path.join(fixturesPath, 'MainActivity-rn068.java'), 'utf8'),
      fs.promises.readFile(path.join(fixturesPath, 'MainActivity-rn068-updated.java'), 'utf8'),
    ]);

    const contents = setModulesMainActivity(rawContents, 'java');
    expect(contents).toEqual(expectContents);
    // Try it twice...
    const nextContents = setModulesMainActivity(contents, 'java');
    expect(nextContents).toEqual(expectContents);
  });

  it(`should add ReactActivityDelegateWrapper for react-native@>=0.68.0 - kotlin`, async () => {
    const [rawContents, expectContents] = await Promise.all([
      fs.promises.readFile(path.join(fixturesPath, 'MainActivity-rn068.kt'), 'utf8'),
      fs.promises.readFile(path.join(fixturesPath, 'MainActivity-rn068-updated.kt'), 'utf8'),
    ]);

    const contents = setModulesMainActivity(rawContents, 'kt');
    expect(contents).toEqual(expectContents);
    // Try it twice...
    const nextContents = setModulesMainActivity(contents, 'kt');
    expect(nextContents).toEqual(expectContents);
  });

  it(`should add ReactActivityDelegateWrapper for react-native@<0.68.0 - java`, async () => {
    const [rawContents, expectContents] = await Promise.all([
      fs.promises.readFile(path.join(fixturesPath, 'MainActivity-rn064.java'), 'utf8'),
      fs.promises.readFile(path.join(fixturesPath, 'MainActivity-rn064-updated.java'), 'utf8'),
    ]);

    const contents = setModulesMainActivity(rawContents, 'java');
    expect(contents).toEqual(expectContents);
    // Try it twice...
    const nextContents = setModulesMainActivity(contents, 'java');
    expect(nextContents).toEqual(expectContents);
  });

  it(`should add ReactActivityDelegateWrapper for react-native@<0.68.0 - kotlin`, async () => {
    const [rawContents, expectContents] = await Promise.all([
      fs.promises.readFile(path.join(fixturesPath, 'MainActivity-rn064.kt'), 'utf8'),
      fs.promises.readFile(path.join(fixturesPath, 'MainActivity-rn064-updated.kt'), 'utf8'),
    ]);

    const contents = setModulesMainActivity(rawContents, 'kt');
    expect(contents).toEqual(expectContents);
    // Try it twice...
    const nextContents = setModulesMainActivity(contents, 'kt');
    expect(nextContents).toEqual(expectContents);
  });

  it(`should add ReactActivityDelegateWrapper for anonymous class - java`, async () => {
    const [rawContents, expectContents] = await Promise.all([
      fs.promises.readFile(path.join(fixturesPath, 'MainActivity-anonymous-delegate.java'), 'utf8'),
      fs.promises.readFile(
        path.join(fixturesPath, 'MainActivity-anonymous-delegate-updated.java'),
        'utf8'
      ),
    ]);

    const contents = setModulesMainActivity(rawContents, 'java');
    expect(contents).toEqual(expectContents);
    // Try it twice...
    const nextContents = setModulesMainActivity(contents, 'java');
    expect(nextContents).toEqual(expectContents);
  });

  it(`should add ReactActivityDelegateWrapper for anonymous class - kotlin`, async () => {
    const [rawContents, expectContents] = await Promise.all([
      fs.promises.readFile(path.join(fixturesPath, 'MainActivity-anonymous-delegate.kt'), 'utf8'),
      fs.promises.readFile(
        path.join(fixturesPath, 'MainActivity-anonymous-delegate-updated.kt'),
        'utf8'
      ),
    ]);

    const contents = setModulesMainActivity(rawContents, 'kt');
    expect(contents).toEqual(expectContents);
    // Try it twice...
    const nextContents = setModulesMainActivity(contents, 'kt');
    expect(nextContents).toEqual(expectContents);
  });
});
