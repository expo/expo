import * as colorString from 'color-string';
import { vol } from 'memfs';

import configureColorsXml from '../Colors.xml';
import reactNativeProject from './fixtures/react-native-project-structure';

// in `__mocks__/fs.ts` memfs is being used as a mocking library
jest.mock('fs');

describe('Colors.xml', () => {
  describe('configureColorsXml', () => {
    beforeEach(() => {
      vol.fromJSON(reactNativeProject, '/app');
    });
    afterEach(() => {
      vol.reset();
    });

    const androidMainPath = '/app/android/app/src/main';
    const filePath = `${androidMainPath}/res/values/colors.xml`;

    it('creates correct file', async () => {
      await configureColorsXml(androidMainPath, colorString.get('red'));
      const actual = vol.readFileSync(filePath, 'utf-8');
      const expected = `<?xml version="1.0" encoding="utf-8"?>
<resources>
  <!-- Below line is handled by 'expo-splash-screen' command and it's discouraged to modify it manually -->
  <color name="splashscreen_background">#FF0000</color>
</resources>
`;
      expect(actual).toEqual(expected);
    });

    it('updates existing file with correct color', async () => {
      vol.writeFileSync(
        filePath,
        `<?xml version="1.0" encoding="utf-8"?>
<resources>
  <!-- Below line is handled by 'expo-splash-screen' command and it's discouraged to modify it manually -->
  <color name="splashscreen_background">#FFCCAABB</color>
</resources>
`
      );
      await configureColorsXml(androidMainPath, colorString.get('green'));
      const actual = vol.readFileSync(filePath, 'utf-8');
      const expected = `<?xml version="1.0" encoding="utf-8"?>
<resources>
  <!-- Below line is handled by 'expo-splash-screen' command and it's discouraged to modify it manually -->
  <color name="splashscreen_background">#008000</color>
</resources>
`;
      expect(actual).toEqual(expected);
    });
  });
});
