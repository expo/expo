import { vol } from 'memfs';

import { parseXMLAsync } from '../../utils/XML';
import {
  getColorsAsObject,
  getObjectAsColorsXml,
  getProjectColorsXMLPathAsync,
  removeColorItem,
  setColorItem,
} from '../Colors';
import { buildResourceItem, readResourcesXMLAsync } from '../Resources';

jest.mock('fs');

describe(setColorItem, () => {
  beforeAll(async () => {
    const directoryJSON = {
      './android/app/src/main/res/values/colors.xml': '<resources></resources>',
    };
    vol.fromJSON(directoryJSON, '/app');
  });
  afterAll(async () => {
    vol.reset();
  });

  it(`gets different themed colors`, async () => {
    const path = await getProjectColorsXMLPathAsync('/app', { kind: 'values-night' });
    expect(path).toBe('/app/android/app/src/main/res/values-night/colors.xml');
  });
  it(`modifies the colors file`, async () => {
    const path = await getProjectColorsXMLPathAsync('/app');
    expect(path).toBe('/app/android/app/src/main/res/values/colors.xml');
    // read the colors object
    let colors = await readResourcesXMLAsync({ path });
    expect(colors).toStrictEqual({ resources: {} });

    const colorItemToAdd = buildResourceItem({ name: 'somn', value: '#fff000' });

    // Add a color item
    colors = setColorItem(colorItemToAdd, colors);
    // check the object
    expect(colors).toStrictEqual({ resources: { color: [colorItemToAdd] } });
    // change the color
    colorItemToAdd._ = '#000000';
    // reassign the color
    colors = setColorItem(colorItemToAdd, colors);
    // check the object is reassigned
    expect(colors.resources.color[0]._).toBe('#000000');
    // ensure an extra color was not added
    expect(colors.resources.color.length).toBe(1);
    // Remove the color item
    colors = removeColorItem('somn', colors);
    // doesn't fully reset the colors.
    expect(colors).toStrictEqual({ resources: { color: [] } });
  });
});

describe(getColorsAsObject, () => {
  it(`converts as expected`, async () => {
    // Parsed from a string for DX readability
    const xml = await parseXMLAsync(
      [
        '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>',
        '<resources>',
        '  <color name="colorPrimary">#FFBB86FC</color>',
        '  <color name="navigationBar">red</color>',
        '  <color name="foobar">@bacon</color>',
        '</resources>',
      ].join('\n')
    );

    const colors = getColorsAsObject(xml as any);

    expect(colors).toStrictEqual({
      colorPrimary: '#FFBB86FC',
      foobar: '@bacon',
      navigationBar: 'red',
    });
  });
});

describe(getObjectAsColorsXml, () => {
  it(`converts object to object matching parsed colors.xml`, async () => {
    // Parsed from a string for DX readability
    const colors = [
      '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>',
      '<resources>',
      '  <color name="colorPrimary">#FFBB86FC</color>',
      '  <color name="navigationBar">red</color>',
      '  <color name="foobar">@bacon</color>',
      '</resources>',
    ].join('\n');

    expect(
      getObjectAsColorsXml({ colorPrimary: '#FFBB86FC', navigationBar: 'red', foobar: '@bacon' })
    ).toStrictEqual(await parseXMLAsync(colors));
  });
});
