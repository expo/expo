import { vol } from 'memfs';

import { writeXMLAsync } from '../../utils/XML';
import { buildResourceItem, readResourcesXMLAsync } from '../Resources';
import {
  getProjectStylesXMLPathAsync,
  getStyleParent,
  getStylesItem,
  removeStylesItem,
  setStylesItem,
} from '../Styles';
jest.mock('fs');

const mockStyles = `
<?xml
  version="1.0"
  encoding="UTF-8"
  standalone="yes"
?>
<resources>
  <style name="AppTheme" parent="Theme.AppCompat.Light.NoActionBar">
    <item name="android:textColor">#000000</item>
    <item name="android:windowTranslucentStatus">true</item>
    <item name="colorPrimary">@color/colorPrimary</item>
  </style>
  <style name="Theme.App.SplashScreen" parent="AppTheme">
    <item name="android:windowBackground">@drawable/splashscreen</item>
  </style>
</resources>`;

describe('Styles', () => {
  beforeAll(async () => {
    const directoryJSON = {
      './app/android/app/src/main/res/values/styles.xml': mockStyles,
      './empty/android/app/src/main/res/values/styles.xml': '<resources></resources>',
    };
    vol.fromJSON(directoryJSON, '/');
  });
  afterAll(async () => {
    vol.reset();
  });

  it(`sets a style on an empty resource item`, async () => {
    const stylesPath = await getProjectStylesXMLPathAsync('/empty')!;
    const xml = await readResourcesXMLAsync({ path: stylesPath });
    const parent = { name: 'AppTheme', parent: 'Theme.AppCompat.Light.NoActionBar' };
    setStylesItem({
      xml,
      parent,
      item: buildResourceItem({ name: 'android:textColor', value: '#fff000' }),
    });
    await writeXMLAsync({ path: stylesPath, xml });

    const modifiedXml = await readResourcesXMLAsync({ path: stylesPath });

    expect(getStyleParent(modifiedXml, parent)).toStrictEqual({
      $: { name: 'AppTheme', parent: 'Theme.AppCompat.Light.NoActionBar' },
      item: [{ $: { name: 'android:textColor' }, _: '#fff000' }],
    });
  });
  it(`changes the value of a style`, async () => {
    const stylesPath = await getProjectStylesXMLPathAsync('/app')!;
    const xml = await readResourcesXMLAsync({ path: stylesPath });
    const parent = { name: 'Theme.App.SplashScreen', parent: 'AppTheme' };
    setStylesItem({
      xml,
      parent,
      item: buildResourceItem({ name: 'android:textColor', value: '#ffffff' }),
    });
    await writeXMLAsync({ path: stylesPath, xml });

    const modifiedXml = await readResourcesXMLAsync({ path: stylesPath });

    expect(getStyleParent(modifiedXml, parent)).toStrictEqual({
      $: { name: 'Theme.App.SplashScreen', parent: 'AppTheme' },
      item: [
        { $: { name: 'android:windowBackground' }, _: '@drawable/splashscreen' },
        {
          $: {
            name: 'android:textColor',
          },
          _: '#ffffff',
        },
      ],
    });
  });

  it(`removes a value`, async () => {
    const stylesPath = await getProjectStylesXMLPathAsync('/app')!;
    const xml = await readResourcesXMLAsync({ path: stylesPath });
    const parent = { name: 'Theme.App.SplashScreen', parent: 'AppTheme' };
    expect(getStylesItem({ xml, parent, name: 'android:textColor' })).toStrictEqual({
      $: {
        name: 'android:textColor',
      },
      _: '#ffffff',
    });

    removeStylesItem({
      xml,
      parent,
      name: 'android:textColor',
    });
    expect(getStylesItem({ xml, parent, name: 'android:textColor' })).toBe(null);
  });
});
