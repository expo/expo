import { XML } from '@expo/config-plugins';

import { setSplashStrings } from '../withAndroidSplashStrings';

describe(setSplashStrings, () => {
  it('add expo_splash_screen_strings', () => {
    const results = setSplashStrings({ resources: {} }, 'cover');
    const expectXML = `\
<resources>
  <string name="expo_splash_screen_resize_mode" translatable="false">cover</string>
</resources>`;
    expect(XML.format(results)).toEqual(expectXML);
  });

  it('override old expo_splash_screen_strings', () => {
    const results = setSplashStrings(
      { resources: { string: [{ $: { name: 'expo_splash_screen_resize_mode' }, _: 'contain' }] } },
      'native'
    );
    const expectXML = `\
<resources>
  <string name="expo_splash_screen_resize_mode" translatable="false">native</string>
</resources>`;
    expect(XML.format(results)).toEqual(expectXML);
  });
});
