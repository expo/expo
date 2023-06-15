import { XML } from '@expo/config-plugins';

import { setSplashStrings } from '../withAndroidSplashStrings';

describe(setSplashStrings, () => {
  it('add expo_splash_screen_strings', () => {
    const results = setSplashStrings({ resources: {} }, 'cover', false, '2000');
    const expectXML = `\
<resources>
  <string name="expo_splash_screen_resize_mode" translatable="false">cover</string>
  <string name="expo_splash_screen_status_bar_translucent" translatable="false">false</string>
  <string name="expo_splash_screen_fade_duration_ms" translatable="false">2000</string>
</resources>`;
    expect(XML.format(results)).toEqual(expectXML);
  });

  it('override old expo_splash_screen_strings', () => {
    const results = setSplashStrings(
      { resources: { string: [{ $: { name: 'expo_splash_screen_resize_mode' }, _: 'contain' }] } },
      'native',
      false,
      '2000'
    );
    const expectXML = `\
<resources>
  <string name="expo_splash_screen_resize_mode" translatable="false">native</string>
  <string name="expo_splash_screen_status_bar_translucent" translatable="false">false</string>
  <string name="expo_splash_screen_fade_duration_ms" translatable="false">2000</string>
</resources>`;
    expect(XML.format(results)).toEqual(expectXML);
  });
});
