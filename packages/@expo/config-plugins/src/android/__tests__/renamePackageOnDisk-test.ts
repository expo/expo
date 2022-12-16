import { fs, vol } from 'memfs';

import { renamePackageOnDisk } from '../Package';

jest.mock('fs');

describe('package', () => {
  describe('renamePackageOnDisk', () => {
    const EXAMPLE_MAIN_APPLICATION = `
package com.lololol;

public class MainApplication extends Application implements ReactApplication {
}
`;

    const EXAMPLE_MAIN_ACTIVITY = `
package com.lololol;

public class MainActivity extends ReactActivity {
}
`;

    const EXAMPLE_NESTED_CLASS = `
package com.lololol.example;
import com.lololol.example.hi.other;

public class SomeClass {
}
`;

    beforeEach(async () => {
      const directoryJSON = {
        './android/app/BUCK': 'package = "com.lololol"',
        './android/app/src/main/java/com/lololol/MainApplication.java': EXAMPLE_MAIN_APPLICATION,
        './android/app/src/main/java/com/lololol/MainActivity.java': EXAMPLE_MAIN_ACTIVITY,
        './android/app/src/main/java/com/lololol/example/SomeClass.java': EXAMPLE_NESTED_CLASS,
      };
      vol.fromJSON(directoryJSON, '/myapp');
    });

    afterEach(() => vol.reset());

    it('re-creates the directory structure and replaces occurrences of old package in files', async () => {
      await renamePackageOnDisk({ android: { package: 'xyz.bront.app' } }, '/myapp');
      const mainActivityPath = '/myapp/android/app/src/main/java/xyz/bront/app/MainActivity.java';
      expect(fs.existsSync(mainActivityPath)).toBeTruthy();
      expect(fs.readFileSync(mainActivityPath).toString()).toMatch('package xyz.bront.app');

      const nestedClassPath =
        '/myapp/android/app/src/main/java/xyz/bront/app/example/SomeClass.java';
      expect(fs.existsSync(nestedClassPath)).toBeTruthy();
      expect(fs.readFileSync(nestedClassPath).toString()).toMatch('package xyz.bront.app');
      expect(fs.readFileSync(nestedClassPath).toString()).not.toMatch('com.lololol');

      const buckPath = '/myapp/android/app/BUCK';
      expect(fs.readFileSync(buckPath).toString()).toMatch('package = "xyz.bront.app"');
      expect(fs.readFileSync(buckPath).toString()).not.toMatch('com.lololol');
    });

    it('does not clobber itself if package has similar parts', async () => {
      await renamePackageOnDisk({ android: { package: 'com.bront' } }, '/myapp');
      const mainActivityPath = '/myapp/android/app/src/main/java/com/bront/MainActivity.java';
      expect(fs.existsSync(mainActivityPath)).toBeTruthy();
      expect(fs.readFileSync(mainActivityPath).toString()).toMatch('package com.bront');
    });
  });
});
