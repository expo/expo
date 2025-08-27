'use strict';
import { fetch } from 'expo/fetch';
import { Asset } from 'expo-asset';
import Constants from 'expo-constants';
import { File, Directory, Paths } from 'expo-file-system';
import * as FS from 'expo-file-system/legacy';
import { Platform } from 'react-native';

export const name = 'FileSystem';
const shouldSkipTestsRequiringPermissions = false;

export async function test({ describe, expect, it, ...t }) {
  const describeWithPermissions = shouldSkipTestsRequiringPermissions ? t.xdescribe : describe;

  const testDirectory = FS.documentDirectory + 'tests/';
  t.beforeEach(async () => {
    try {
      await FS.makeDirectoryAsync(testDirectory);
    } catch {}
  });
  t.afterEach(async () => {
    try {
      await FS.deleteAsync(testDirectory);
    } catch {}
  });
  describe('FileSystem', () => {
    if (Constants.appOwnership === 'expo') {
      describe('managed workflow', () => {
        it('throws out-of-scope exceptions', async () => {
          expect(() => {
            new File(Paths.document, '..', 'file.txt').create();
          }).toThrow();
          expect(() => {
            new File(Paths.document, '..', 'file.txt').textSync();
          }).toThrow();
          expect(() => {
            new File(Paths.document, '..', 'file.txt').copy(new File(Paths.document, 'file.txt'));
          }).toThrow();
        });
      });
    }

    describeWithPermissions('picker operations', () => {
      let originalTimeout;
      t.beforeAll(async () => {
        originalTimeout = t.jasmine.DEFAULT_TIMEOUT_INTERVAL;
        t.jasmine.DEFAULT_TIMEOUT_INTERVAL = originalTimeout * 10;
      });
      t.afterAll(() => {
        t.jasmine.DEFAULT_TIMEOUT_INTERVAL = originalTimeout;
      });
      it('Supports some operations on SAF directories', async () => {
        const safDirectory = await Directory.pickDirectoryAsync();

        const testDirectory = new Directory(safDirectory.uri, 'test');
        testDirectory.create();

        const file = new File(testDirectory.uri, 'newFile.txt');
        file.create();
        file.write('test');

        expect(file.exists).toBe(true);
        expect(file.textSync()).toBe('test');

        const subdirs = [];
        for (let i = 0; i < 10; i++) {
          const subdir = new Directory(testDirectory.uri, `subdir${i}`);
          subdir.create();
          subdirs.push(subdir);
        }

        subdirs.forEach((subdir, i) => {
          expect(subdir.exists).toBe(true);
        });

        const listedSubdirs = testDirectory.list().filter((item) => item instanceof Directory);
        expect(listedSubdirs.length).toBe(10);

        testDirectory.delete();
        expect(testDirectory.exists).toBe(false);
      });

      //   it('allows picking files from cache directory', async () => {
      //     const file = await File.pickFileAsync(Paths.cache.uri);
      //     expect(file.exists).toBe(true);
      //   });

      //   it('allows picking directories from cache directory', async () => {
      //     const dir = await Directory.pickDirectoryAsync(Paths.cache.uri);
      //     expect(dir.exists).toBe(true);
      //   });
    });
  });
}
