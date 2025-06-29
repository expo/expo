'use strict';

import { Asset } from 'expo-asset';
import Constants from 'expo-constants';
import * as FS from 'expo-file-system';
import { Platform } from 'expo-modules-core';

export const name = 'FileSystem';

export async function test({ describe, expect, it, ...t }) {
  describe('FileSystem', () => {
    const throws = async (run) => {
      let error = null;
      try {
        await run();
      } catch (e) {
        error = e;
      }
      expect(error).toBeTruthy();
    };

    if (Constants.appOwnership === 'expo') {
      describe('managed workflow', () => {
        it('throws out-of-scope exceptions', async () => {
          const p = FS.documentDirectory;

          await throws(() => FS.readAsStringAsync(p + '../hello/world'));
          await throws(() => FS.writeAsStringAsync(p + '../hello/world', ''));
          await throws(() => FS.deleteAsync(p + '../hello/world'));
          await throws(() => FS.deleteAsync(p));
          await throws(() => FS.deleteAsync(FS.cacheDirectory));
          await throws(() => FS.moveAsync({ from: p + '../a/b', to: 'c' }));
          await throws(() => FS.moveAsync({ from: 'c', to: p + '../a/b' }));
          await throws(() => FS.copyAsync({ from: p + '../a/b', to: 'c' }));
          await throws(() => FS.copyAsync({ from: 'c', to: p + '../a/b' }));
          await throws(() => FS.makeDirectoryAsync(p + '../hello/world'));
          await throws(() => FS.readDirectoryAsync(p + '../hello/world'));
          await throws(() => FS.downloadAsync('https://www.google.com', p + '../hello/world'));
          await throws(() => FS.readDirectoryAsync(p + '../'));
          await throws(() => FS.downloadAsync('https://www.google.com', p + '../hello/world'));
        });
      });
    }

    if (Platform.OS === 'web') {
      // Web doesn't support FileSystem
      return;
    }

    it('Can read partial content with UTF8 encoding', async () => {
      const fileUri = FS.documentDirectory + 'random-text.txt';
      const randomText = `Hello, World! This is a test file`;

      // First ensure the file doesn't exist
      await FS.deleteAsync(fileUri, { idempotent: true });

      // Write test file
      await FS.writeAsStringAsync(fileUri, randomText);

      // Test partial reading with different positions and lengths
      const tests = [
        { expected: 'Hello, World! This is a test file' },
        {
          position: 10,
          expected: 'ld! This is a test file',
        },
        {
          position: 15,
          length: 5,
          expected: 'his i',
        },
        {
          position: 20,
          expected: 's a test file',
        },
      ];

      for (const test of tests) {
        const result = await FS.readAsStringAsync(fileUri, {
          position: test.position,
          length: test.length,
          encoding: FS.EncodingType.UTF8,
        });

        expect(result).toBe(test.expected);
      }

      // Clean up
      await FS.deleteAsync(fileUri);
    });

    it('Should throw error for negative position and length', async () => {
      const fileUri = FS.documentDirectory + 'error-test.txt';
      await FS.writeAsStringAsync(fileUri, 'Hello World! This is a test file.');

      // Test 1: Using existing throws helper for negative position
      await throws(() =>
        FS.readAsStringAsync(fileUri, {
          position: -1,
          length: 10,
        })
      );

      // Test 2: Using existing throws helper for negative length
      await throws(() =>
        FS.readAsStringAsync(fileUri, {
          position: 5,
          length: -10,
        })
      );

      // Test 3: Negative position in writeAsStringAsync
      await throws(() =>
        FS.writeAsStringAsync(fileUri, 'test', {
          position: -5,
        })
      );

      // Test 4: Both negative position and length
      await throws(() =>
        FS.readAsStringAsync(fileUri, {
          position: -1,
          length: -5,
        })
      );

      // Test 5: More detailed error check with try/catch
      try {
        await FS.readAsStringAsync(fileUri, {
          position: -5,
          length: -5,
        });
        // If we get here, the test should fail
        expect(true).toBe(false); // Force failure
      } catch (error) {
        // Error should be thrown - this is expected
        expect(error).toBeTruthy();
        expect(error.message).toMatch(/Position cannot be negative|negative|Position/i);
      }

      // Clean up
      await FS.deleteAsync(fileUri, { idempotent: true });
    });

    it('Can read string by position in Base64', async () => {
      const fileUri = FS.documentDirectory + 'random-text.txt';

      // Clean up any existing file
      await FS.deleteAsync(fileUri, { idempotent: true });

      // Create test content with known pattern
      const originalText = 'Hello World! 12345678';

      // Write original text as UTF8
      await FS.writeAsStringAsync(fileUri, originalText, {
        encoding: FS.EncodingType.UTF8,
      });

      // Test reading different positions in Base64
      const tests = [
        {
          description: 'Read first 4 bytes as Base64',
          position: 0,
          length: 4,
          expectedText: 'Hell', // What we expect when decoded back
        },
        {
          description: 'Read middle 4 bytes as Base64',
          position: 6,
          length: 4,
          expectedText: 'Worl', // What we expect when decoded back
        },
        {
          description: 'Read last 4 bytes as Base64',
          position: 16,
          length: 4,
          expectedText: '4567', // What we expect when decoded back
        },
      ];

      for (const test of tests) {
        // Read specific position in Base64
        const base64Result = await FS.readAsStringAsync(fileUri, {
          encoding: FS.EncodingType.Base64,
          position: test.position,
          length: test.length,
        });

        // Verify Base64 format (length must be multiple of 4)
        expect(base64Result.length % 4).toBe(0);
        expect(typeof base64Result).toBe('string');
        expect(base64Result.length).toBeGreaterThan(0);

        // Verify we can decode it back to expected text using atob
        const decoded = atob(base64Result);

        expect(decoded).toBe(test.expectedText);
      }

      // Additional test: read the same data as UTF8 and compare
      for (const test of tests) {
        // Read same position as UTF8
        const utf8Result = await FS.readAsStringAsync(fileUri, {
          encoding: FS.EncodingType.UTF8,
          position: test.position,
          length: test.length,
        });

        // Read same position as Base64
        const base64Result = await FS.readAsStringAsync(fileUri, {
          encoding: FS.EncodingType.Base64,
          position: test.position,
          length: test.length,
        });

        // Decode Base64 and compare with UTF8 result
        const decodedBase64 = atob(base64Result);
        expect(decodedBase64).toBe(utf8Result);
        expect(utf8Result).toBe(test.expectedText);
      }

      // Clean up
      await FS.deleteAsync(fileUri, { idempotent: true });
    });

    it('Can write at specific position with UTF8 encoding', async () => {
      const fileUri = FS.documentDirectory + 'random-text.txt';
      const originalText = 'Hello World! This is a test file';

      // Clean up any existing file
      await FS.deleteAsync(fileUri, { idempotent: true });

      // Write initial content
      await FS.writeAsStringAsync(fileUri, originalText);

      // Verify initial content
      const initialContent = await FS.readAsStringAsync(fileUri, {
        encoding: FS.EncodingType.UTF8,
      });
      expect(initialContent).toBe(originalText);

      // Test different position-based writes
      const tests = [
        {
          description: 'Write at beginning',
          position: 0,
          text: 'Hi',
          // Position-based writing overwrites characters starting at position
          expected: 'Hillo World! This is a test file',
        },
        {
          description: 'Write at position 6',
          position: 6,
          text: 'Users! ',
          // "World!" gets overwritten with "Users!"
          expected: 'Hello Users! This is a test file',
        },
        {
          description: 'Write beyond end (append)',
          position: originalText.length,
          text: ' Random text.',
          expected: originalText + ' Random text.',
        },
      ];

      for (const test of tests) {
        // Reset file to original content for each test
        await FS.writeAsStringAsync(fileUri, originalText);

        // Write at specific position
        await FS.writeAsStringAsync(fileUri, test.text, {
          encoding: FS.EncodingType.UTF8,
          position: test.position,
        });

        // Read and verify result
        const result = await FS.readAsStringAsync(fileUri, {
          encoding: FS.EncodingType.UTF8,
        });

        expect(result).toBe(test.expected);
      }

      // Clean up
      await FS.deleteAsync(fileUri, { idempotent: true });
    });

    it('Can write at specific position with Base64 encoding', async () => {
      const fileUri = FS.documentDirectory + 'random-text.txt';

      // Clean up any existing file
      await FS.deleteAsync(fileUri, { idempotent: true });

      // Create initial content using base64
      const originalText = 'Hello World!';
      // Convert to base64 manually since Buffer is not available
      const originalBase64 = btoa(originalText);

      await FS.writeAsStringAsync(fileUri, originalBase64, {
        encoding: FS.EncodingType.Base64,
      });

      // Verify initial content
      const initialContent = await FS.readAsStringAsync(fileUri, {
        encoding: FS.EncodingType.UTF8,
      });
      expect(initialContent).toBe(originalText);

      const insertText = 'test';

      // Test position-based write with base64
      const insertBase64 = btoa(insertText);

      await FS.writeAsStringAsync(fileUri, insertBase64, {
        encoding: FS.EncodingType.Base64,
        position: 0, // Write from beginning
      });

      // Read result as UTF8
      const result = await FS.readAsStringAsync(fileUri, {
        encoding: FS.EncodingType.UTF8,
      });

      // "test" should overwrite "Hello World!" at the beginning
      expect(result).toBe('testo World!');

      // Clean up
      await FS.deleteAsync(fileUri, { idempotent: true });
    });

    it('delete(idempotent) -> delete[error]', async () => {
      const localUri = FS.documentDirectory + 'willDelete.png';

      await FS.deleteAsync(localUri, { idempotent: true });

      let error;
      try {
        await FS.deleteAsync(localUri);
      } catch (e) {
        error = e;
      }
      expect(error.message).toMatch(/could not be deleted/);
    });

    it('delete(idempotent) -> !exists -> download(md5, uri) -> exists -> delete -> !exists', async () => {
      const localUri = FS.documentDirectory + 'download1.png';

      const assertExists = async (expectedToExist) => {
        const { exists } = await FS.getInfoAsync(localUri);
        if (expectedToExist) {
          expect(exists).toBeTruthy();
        } else {
          expect(exists).not.toBeTruthy();
        }
      };

      await FS.deleteAsync(localUri, { idempotent: true });
      await assertExists(false);

      const { md5, headers } = await FS.downloadAsync(
        'https://s3-us-west-1.amazonaws.com/test-suite-data/avatar2.png',
        localUri,
        { md5: true }
      );
      expect(md5).toBe('1e02045c10b8f1145edc7c8375998f87');
      await assertExists(true);
      expect(headers['Content-Type']).toBe('image/png');

      await FS.deleteAsync(localUri);
      await assertExists(false);
    }, 9000);

    it('Can read/write Base64', async () => {
      const asset = await Asset.fromModule(require('../assets/icons/app.png'));
      await asset.downloadAsync();

      for (let startingPosition = 0; startingPosition < 3; startingPosition++) {
        const options = {
          encoding: FS.EncodingType.Base64,
          position: startingPosition,
          length: startingPosition + 1,
        };

        const b64 = await FS.readAsStringAsync(asset.localUri, options);
        expect(b64).toBeDefined();
        expect(typeof b64).toBe('string');
        expect(b64.length % 4).toBe(0);

        const localUri = FS.documentDirectory + 'b64.png';

        await FS.writeAsStringAsync(localUri, b64, { encoding: FS.EncodingType.Base64 });

        expect(await FS.readAsStringAsync(localUri, { encoding: FS.EncodingType.Base64 })).toBe(
          b64
        );
      }
    });

    it('delete(idempotent) -> delete[error]', async () => {
      const localUri = FS.documentDirectory + 'willDelete.png';

      await FS.deleteAsync(localUri, { idempotent: true });

      let error;
      try {
        await FS.deleteAsync(localUri);
      } catch (e) {
        error = e;
      }
      expect(error.message).toMatch(/could not be deleted/);
    });

    it('download(md5, uri) -> read -> delete -> !exists -> read[error]', async () => {
      const localUri = FS.documentDirectory + 'download1.txt';

      const { md5 } = await FS.downloadAsync(
        'https://s3-us-west-1.amazonaws.com/test-suite-data/text-file.txt',
        localUri,
        { md5: true }
      );
      expect(md5).toBe('86d73d2f11e507365f7ea8e7ec3cc4cb');

      const string = await FS.readAsStringAsync(localUri);
      expect(string).toBe('hello, world\nthis is a test file\n');

      await FS.deleteAsync(localUri, { idempotent: true });

      let error;
      try {
        await FS.readAsStringAsync(localUri);
      } catch (e) {
        error = e;
      }
      expect(error).toBeTruthy();
    }, 9000);

    it('delete(idempotent) -> !exists -> write -> read -> write -> read', async () => {
      const localUri = FS.documentDirectory + 'write1.txt';

      await FS.deleteAsync(localUri, { idempotent: true });

      const { exists } = await FS.getInfoAsync(localUri);
      expect(exists).not.toBeTruthy();

      const writeAndVerify = async (expected) => {
        await FS.writeAsStringAsync(localUri, expected);
        const string = await FS.readAsStringAsync(localUri);
        expect(string).toBe(expected);
      };

      await writeAndVerify('hello, world');
      await writeAndVerify('hello, world!!!!!!');
    });

    it('delete(new) -> 2 * [write -> move -> !exists(orig) -> read(new)]', async () => {
      const from = FS.documentDirectory + 'from.txt';
      const to = FS.documentDirectory + 'to.txt';
      const contents = ['contents 1', 'contents 2'];

      await FS.deleteAsync(to, { idempotent: true });

      // Move twice to make sure we can overwrite
      for (let i = 0; i < 2; ++i) {
        await FS.writeAsStringAsync(from, contents[i]);

        await FS.moveAsync({ from, to });

        const { exists } = await FS.getInfoAsync(from);
        expect(exists).not.toBeTruthy();

        expect(await FS.readAsStringAsync(to)).toBe(contents[i]);
      }
    });

    it('delete(new) -> 2 * [write -> copy -> exists(orig) -> read(new)]', async () => {
      const from = FS.documentDirectory + 'from.txt';
      const to = FS.documentDirectory + 'to.txt';
      const contents = ['contents 1', 'contents 2'];

      await FS.deleteAsync(to, { idempotent: true });

      // Copy twice to make sure we can overwrite
      for (let i = 0; i < 2; ++i) {
        await FS.writeAsStringAsync(from, contents[i]);

        await FS.copyAsync({ from, to });

        const { exists } = await FS.getInfoAsync(from);
        expect(exists).toBeTruthy();

        expect(await FS.readAsStringAsync(to)).toBe(contents[i]);
      }
    });

    it(
      'delete(dir) -> write(dir/file)[error] -> mkdir(dir) ->' +
        'mkdir(dir)[error] -> write(dir/file) -> read',
      async () => {
        let error;
        const path = FS.documentDirectory + 'dir/file';
        const dir = FS.documentDirectory + 'dir';
        const contents = 'hello, world';

        await FS.deleteAsync(dir, { idempotent: true });

        error = null;
        try {
          await FS.writeAsStringAsync(path, contents);
        } catch (e) {
          error = e;
        }
        expect(error).toBeTruthy();

        await FS.makeDirectoryAsync(dir);

        error = null;
        try {
          await FS.makeDirectoryAsync(dir);
        } catch (e) {
          error = e;
        }
        expect(error).toBeTruthy();

        await FS.writeAsStringAsync(path, contents);

        expect(await FS.readAsStringAsync(path)).toBe(contents);
      }
    );

    it(
      'delete(dir) -> write(dir/dir2/file)[error] -> ' +
        'mkdir(dir/dir2, intermediates) -> ' +
        'mkdir(dir/dir2, intermediates) -> write(dir/dir2/file) -> read',
      async () => {
        let error;
        const path = FS.documentDirectory + 'dir/dir2/file';
        const dir = FS.documentDirectory + 'dir/dir2';
        const contents = 'hello, world';

        await FS.deleteAsync(dir, { idempotent: true });

        error = null;
        try {
          await FS.writeAsStringAsync(path, contents);
        } catch (e) {
          error = e;
        }
        expect(error).toBeTruthy();

        await FS.makeDirectoryAsync(dir, {
          intermediates: true,
        });

        error = null;
        try {
          await FS.makeDirectoryAsync(dir);
        } catch (e) {
          error = e;
        }
        expect(error).toBeTruthy();

        error = null;
        try {
          await FS.makeDirectoryAsync(dir, {
            intermediates: true,
          });
        } catch (e) {
          error = e;
        }
        expect(error).toBe(null);

        await FS.writeAsStringAsync(path, contents);

        expect(await FS.readAsStringAsync(path)).toBe(contents);
      }
    );

    it('getInfo(dirPath)', async () => {
      const dir = FS.documentDirectory + 'dir';
      const path = FS.documentDirectory + 'dir/file.txt';

      await FS.deleteAsync(dir, { idempotent: true });
      await FS.makeDirectoryAsync(dir, {
        intermediates: true,
      });
      await FS.writeAsStringAsync(path, 'Expo is awesome 🚀🚀🚀');
      const info = await FS.getInfoAsync(dir);

      expect(info).toBeDefined();
      expect(info.exists).toBe(true);
      expect(info.isDirectory).toBe(true);
      expect(info.size).toBe(28);
    });

    /*
    This test fails in CI because of an exception being thrown by deleteAsync in the nativeModule.
    I traced it down to the FileUtils.forceDelete call here:
    https://github.com/expo/expo/blob/bcd136b096df84e0b0f72a15acbda45491de8201/packages/expo-file-system/android/src/main/java/expo/modules/filesystem/FileSystemModule.java#L294
    it(
      'delete(dir, idempotent) -> make tree -> check contents ' +
        '-> check directory listings' +
        '-> move -> check directory listings' +
        '-> copy -> check directory listings',
      async () => {
        let error;
        const dir = FS.documentDirectory + 'dir';

        await FS.deleteAsync(dir, { idempotent: true });

        await FS.makeDirectoryAsync(dir + '/child1', {
          intermediates: true,
        });
        await FS.makeDirectoryAsync(dir + '/child2', {
          intermediates: true,
        });

        await FS.writeAsStringAsync(dir + '/file1', 'contents1');
        await FS.writeAsStringAsync(dir + '/file2', 'contents2');

        await FS.writeAsStringAsync(dir + '/child1/file3', 'contents3');

        await FS.writeAsStringAsync(dir + '/child2/file4', 'contents4');
        await FS.writeAsStringAsync(dir + '/child2/file5', 'contents5');

        const checkContents = async (path, contents) =>
          expect(await FS.readAsStringAsync(path)).toBe(contents);

        await checkContents(dir + '/file1', 'contents1');
        await checkContents(dir + '/file2', 'contents2');
        await checkContents(dir + '/child1/file3', 'contents3');
        await checkContents(dir + '/child2/file4', 'contents4');
        await checkContents(dir + '/child2/file5', 'contents5');

        const checkDirectory = async (path, expected) => {
          const list = await FS.readDirectoryAsync(path);
          expect(list.sort()).toEqual(expected.sort());
        };

        const checkRoot = async root => {
          await checkDirectory(root, ['file1', 'file2', 'child1', 'child2']);
          await checkDirectory(root + '/child1', ['file3']);
          await checkDirectory(root + '/child2', ['file4', 'file5']);

          error = null;
          try {
            await checkDirectory(root + '/file1', ['nope']);
          } catch (e) {
            error = e;
          }
          expect(error).toBeTruthy();
        };

        await checkRoot(dir);

        await FS.deleteAsync(FS.documentDirectory + 'moved', {
          idempotent: true,
        });
        await FS.moveAsync({ from: dir, to: FS.documentDirectory + 'moved' });
        await checkRoot(FS.documentDirectory + 'moved');
        await FS.copyAsync({
          from: FS.documentDirectory + 'moved',
          to: FS.documentDirectory + 'copied',
        });
        await checkRoot(FS.documentDirectory + 'copied');
      }
    );
    */

    it('delete(idempotent) -> download(md5) -> getInfo(size)', async () => {
      const localUri = FS.documentDirectory + 'download1.png';

      await FS.deleteAsync(localUri, { idempotent: true });

      const { md5 } = await FS.downloadAsync(
        'https://s3-us-west-1.amazonaws.com/test-suite-data/avatar2.png',
        localUri,
        { md5: true }
      );
      expect(md5).toBe('1e02045c10b8f1145edc7c8375998f87');

      const { size, modificationTime } = await FS.getInfoAsync(localUri);
      expect(size).toBe(3230);
      const nowTime = 0.001 * new Date().getTime();
      expect(nowTime - modificationTime).toBeLessThan(3600);

      await FS.deleteAsync(localUri);
    }, 30000);

    it('missing parameters', async () => {
      const p = FS.documentDirectory + 'test';

      await throws(() => FS.moveAsync({ from: p }));
      await throws(() => FS.moveAsync({ to: p }));
      await throws(() => FS.copyAsync({ from: p }));
      await throws(() => FS.copyAsync({ to: p }));
    });

    it('can read root directories', async () => {
      await FS.readDirectoryAsync(FS.documentDirectory);
      await FS.readDirectoryAsync(FS.cacheDirectory);
    });

    it('download(network failure)', async () => {
      const localUri = FS.documentDirectory + 'download1.png';

      const assertExists = async (expectedToExist) => {
        const { exists } = await FS.getInfoAsync(localUri);
        if (expectedToExist) {
          expect(exists).toBeTruthy();
        } else {
          expect(exists).not.toBeTruthy();
        }
      };

      await FS.deleteAsync(localUri, { idempotent: true });
      await assertExists(false);

      let error;
      try {
        await FS.downloadAsync('https://nonexistent-subdomain.expo.io', localUri, {
          md5: true,
          sessionType: FS.FileSystemSessionType.FOREGROUND,
        });
      } catch (e) {
        error = e;
      }
      expect(error).toBeTruthy();
      await assertExists(false);
      await FS.deleteAsync(localUri, { idempotent: true });
    }, 30000);

    it('download(404)', async () => {
      const localUri = FS.documentDirectory + 'download1.png';

      const assertExists = async (expectedToExist) => {
        const { exists } = await FS.getInfoAsync(localUri);
        if (expectedToExist) {
          expect(exists).toBeTruthy();
        } else {
          expect(exists).not.toBeTruthy();
        }
      };

      await FS.deleteAsync(localUri, { idempotent: true });
      await assertExists(false);

      const { status } = await FS.downloadAsync('https://github.com/omg1231sdfaljs', localUri, {
        md5: true,
      });
      await assertExists(true);
      expect(status).toBe(404);

      await FS.deleteAsync(localUri);
      await assertExists(false);
    }, 30000);

    it('download(nonexistent local path)', async () => {
      try {
        const remoteUrl = 'https://s3-us-west-1.amazonaws.com/test-suite-data/avatar2.png';
        const localUri = FS.documentDirectory + 'doesnt/exists/download1.png';
        await FS.downloadAsync(remoteUrl, localUri);
      } catch (err) {
        expect(err.message).toMatch(/(does not exist)|(doesn't exist)/);
      }
    }, 30000);

    it('mkdir(multi-level) + download(multi-level local path)', async () => {
      const remoteUrl = 'https://s3-us-west-1.amazonaws.com/test-suite-data/avatar2.png';
      const localDirUri = FS.documentDirectory + 'foo/bar/baz';
      const localFileUri = localDirUri + 'download1.png';

      await FS.makeDirectoryAsync(localDirUri, { intermediates: true });

      await FS.downloadAsync(remoteUrl, localFileUri);
    }, 30000);

    it('create UTF-8 folder and get info', async () => {
      const folderName = '中文';
      const folderUri = FS.documentDirectory + folderName;

      const dirInfo = await FS.getInfoAsync(folderUri);
      if (dirInfo.exists) {
        await FS.deleteAsync(folderUri);
      }

      await FS.makeDirectoryAsync(folderUri);
      const newDirInfo = await FS.getInfoAsync(folderUri);

      expect(newDirInfo.exists).toBeTruthy();
      expect(newDirInfo.isDirectory).toBeTruthy();
    }, 30000);

    if (Platform.OS === 'ios') {
      // We cannot run this test on Android because bundleDirectory
      // on Android cannot be accessed using 'file://' protocol.
      it('delete(idempotent) -> !exists -> copy(from bundle) -> exists -> delete -> !exists', async () => {
        const from = 'file://' + FS.bundleDirectory + 'Info.plist';
        const to = FS.documentDirectory + 'Info.plist.copy';

        const assertExists = async (expectedToExist) => {
          const { exists } = await FS.getInfoAsync(to);
          if (expectedToExist) {
            expect(exists).toBeTruthy();
          } else {
            expect(exists).not.toBeTruthy();
          }
        };

        await FS.deleteAsync(to, { idempotent: true });
        await assertExists(false);

        await FS.copyAsync({ from, to });
        await assertExists(true);

        await FS.deleteAsync(to);
        await assertExists(false);
      });
    }
  });
}
