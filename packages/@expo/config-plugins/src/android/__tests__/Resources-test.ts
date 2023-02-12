import { vol } from 'memfs';

import { parseXMLAsync } from '../../utils/XML';
import { fileExistsAsync } from '../../utils/modules';
import { getResourceXMLPathAsync } from '../Paths';
import { getObjectAsResourceGroup, readResourcesXMLAsync } from '../Resources';

jest.mock('fs');

describe(getResourceXMLPathAsync, () => {
  beforeAll(async () => {
    vol.fromJSON(
      {
        './android/app/src/main/res/values/colors.xml': '<resources></resources>',
        // './android/app/src/main/res/values-night/colors.xml': '<resources></resources>',
      },
      '/app'
    );
    vol.fromJSON(
      {
        // no files -- specifically no android folder
      },
      '/managed'
    );
  });
  afterAll(async () => {
    vol.reset();
  });

  it(`returns a fallback value for a missing file`, async () => {
    const path = await getResourceXMLPathAsync('/app', { name: 'colors', kind: 'values-night' });
    // ensure the file is missing so the test works as expected.
    expect(await fileExistsAsync(path)).toBe(false);
    // read the file with a default fallback
    expect(await readResourcesXMLAsync({ path })).toStrictEqual({ resources: {} });
  });
  it(`returns a default value for an XML file`, async () => {
    const path = await getResourceXMLPathAsync('/app', { name: 'colors', kind: 'values' });
    // ensure the file exists so the test works as expected.
    expect(await fileExistsAsync(path)).toBe(true);
    // read the file with a default fallback
    expect(await readResourcesXMLAsync({ path })).toStrictEqual({ resources: {} });
  });
});

describe(getObjectAsResourceGroup, () => {
  it(`matches parsed xml`, async () => {
    // Parsed from a string for DX readability
    const styles = await parseXMLAsync(
      [
        '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>',
        '<resources>',
        '  <style name="AppTheme" parent="Theme.AppCompat.Light.NoActionBar">',
        '    <item name="key">value</item>',
        '    <item name="foo">bar</item>',
        '  </style>',
        '</resources>',
      ].join('\n')
    );

    expect(
      getObjectAsResourceGroup({
        name: 'AppTheme',
        parent: 'Theme.AppCompat.Light.NoActionBar',
        item: { key: 'value', foo: 'bar' },
      })
    ).toStrictEqual((styles.resources as any).style[0]);
  });
});
