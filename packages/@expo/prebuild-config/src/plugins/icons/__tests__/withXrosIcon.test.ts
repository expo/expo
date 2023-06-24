import * as fs from 'fs';
import { vol } from 'memfs';
import * as path from 'path';

import rnFixture from '../../__tests__/fixtures/react-native-project';
import { createXrosIconAsync } from '../withXrosIcon';

const fsReal = jest.requireActual('fs') as typeof fs;

jest.mock('fs');

describe(createXrosIconAsync, () => {
  const iconPath = path.resolve(__dirname, '../../__tests__/fixtures/icon.png');

  const projectRoot = '/app';
  beforeAll(async () => {
    const icon = fsReal.readFileSync(iconPath);

    vol.fromJSON(rnFixture, projectRoot);

    vol.mkdirpSync('/app/assets');
    vol.writeFileSync('/app/assets/front.png', icon);
    vol.writeFileSync('/app/assets/middle.png', icon);
    vol.writeFileSync('/app/assets/back.png', icon);
  });

  afterAll(() => {
    vol.reset();
  });

  it(`create xros icons`, async () => {
    await createXrosIconAsync(projectRoot, {
      xcassetName: 'VisionAppIcon',
      rootAssetsDirectory: '/app/ios/HelloWorld/Images.xcassets',
      layers: ['/app/assets/front.png', '/app/assets/middle.png', '/app/assets/back.png'],
    });

    const prefix = '/app/ios/HelloWorld/Images.xcassets/VisionAppIcon.solidimagestack/';
    const after = vol.toJSON();
    const icons = Object.fromEntries(
      Object.entries(after)
        .filter(([value]) => value.startsWith(prefix))
        .map(([key, value]) => [key.replace(prefix, ''), value])
    );

    const filenames = Object.keys(icons);
    expect(filenames.length).toEqual(10);
    expect(filenames).toMatchInlineSnapshot(`
      [
        "Front.solidimagestacklayer/Content.imageset/App-Icon-1024x1024@2x.png",
        "Front.solidimagestacklayer/Content.imageset/Contents.json",
        "Front.solidimagestacklayer/Contents.json",
        "Middle.solidimagestacklayer/Content.imageset/App-Icon-1024x1024@2x.png",
        "Middle.solidimagestacklayer/Content.imageset/Contents.json",
        "Middle.solidimagestacklayer/Contents.json",
        "Back.solidimagestacklayer/Content.imageset/App-Icon-1024x1024@2x.png",
        "Back.solidimagestacklayer/Content.imageset/Contents.json",
        "Back.solidimagestacklayer/Contents.json",
        "Contents.json",
      ]
    `);

    const contentsJson = Object.fromEntries(
      Object.entries(icons).filter(([filename]) => filename.endsWith('Contents.json'))
    );

    // Ensure all Contents.json files are valid json with an info object.
    expect(
      Object.values(contentsJson).every((contents) => !!JSON.parse(contents as string).info)
    ).toBe(true);

    expect(sortKeysAscending(contentsJson)).toMatchSnapshot();
  });
});

function sortKeysAscending(dict: Record<string, any>): Record<string, any> {
  return Object.fromEntries(Object.entries(dict).sort(([a], [b]) => a.localeCompare(b)));
}
