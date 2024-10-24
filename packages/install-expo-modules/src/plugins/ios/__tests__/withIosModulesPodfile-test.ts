import fs from 'fs';
import path from 'path';

import { updatePodfile } from '../withIosModulesPodfile';

const fixturesPath = path.resolve(__dirname, 'fixtures');

describe(updatePodfile, () => {
  it('should support react-native 0.70 podfile', async () => {
    const [rawContents, expectContents] = await Promise.all([
      fs.promises.readFile(path.join(fixturesPath, 'Podfile-rn070'), 'utf8'),
      fs.promises.readFile(path.join(fixturesPath, 'Podfile-rn070-updated'), 'utf8'),
    ]);

    const sdkVersion = '47.0.0';
    expect(updatePodfile(rawContents, 'HelloWorld', sdkVersion)).toEqual(expectContents);
  });

  it('should support react-native 0.71 podfile', async () => {
    const [rawContents, expectContents] = await Promise.all([
      fs.promises.readFile(path.join(fixturesPath, 'Podfile-rn071'), 'utf8'),
      fs.promises.readFile(path.join(fixturesPath, 'Podfile-rn071-updated'), 'utf8'),
    ]);

    const sdkVersion = '48.0.0';
    expect(updatePodfile(rawContents, 'HelloWorld', sdkVersion)).toEqual(expectContents);
  });

  it('should support react-native 0.76 podfile', async () => {
    const [rawContents, expectContents] = await Promise.all([
      fs.promises.readFile(path.join(fixturesPath, 'Podfile-rn076'), 'utf8'),
      fs.promises.readFile(path.join(fixturesPath, 'Podfile-rn076-updated'), 'utf8'),
    ]);

    const sdkVersion = '52.0.0';
    expect(updatePodfile(rawContents, 'HelloWorld', sdkVersion)).toEqual(expectContents);
  });

  it('minimum support for existing post_integrate hook', async () => {
    const [rawContents, expectContents] = await Promise.all([
      fs.promises.readFile(path.join(fixturesPath, 'Podfile-with-post-integrate'), 'utf8'),
      fs.promises.readFile(path.join(fixturesPath, 'Podfile-with-post-integrate-updated'), 'utf8'),
    ]);

    const sdkVersion = '51.0.0';
    expect(updatePodfile(rawContents, 'HelloWorld', sdkVersion)).toEqual(expectContents);
  });
});

describe('withIosModulesPodfile sdkVersion snapshots', () => {
  const podfileFixture = fs.readFileSync(
    path.join(__dirname, 'fixtures', 'Podfile-rn070'),
    'utf-8'
  );

  ['43.0.0', '44.0.0'].forEach((sdkVersion) => {
    it(`sdkVersion ${sdkVersion}`, () => {
      expect(updatePodfile(podfileFixture, 'HelloWorld', sdkVersion)).toMatchSnapshot();
    });
  });
});
