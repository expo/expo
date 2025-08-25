'use strict';
import { fetch } from 'expo/fetch';
import { Asset } from 'expo-asset';
import Constants from 'expo-constants';
import { File, Directory, Paths } from 'expo-file-system';
import * as FS from 'expo-file-system/legacy';
import { Platform } from 'react-native';

export const name = 'FileSystem';
const shouldSkipTestsRequiringPermissions = true;

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

        safDirectory.list().forEach((sd) => {
          sd.delete();
        });
        expect(safDirectory.list().length).toBe(0);

        safDirectory.createFile('newFile', 'text/plain');
        expect(safDirectory.list().length).toBe(1);

        safDirectory.list().forEach((sd) => {
          sd.delete();
        });
        expect(safDirectory.list().length).toBe(0);

        const file = safDirectory.createFile('newFile', 'text/plain');
        file.write('test');
        expect(file.textSync()).toBe('test');
        expect(file.bytesSync()).toEqual(new Uint8Array([116, 101, 115, 116]));
        expect(file.base64Sync()).toBe('dGVzdA==');
        const file2 = safDirectory.createFile('newFile2', 'text/plain');

        file2.write(new Uint8Array([116, 101, 115, 116]));
        expect(file2.textSync()).toBe('test');
        expect(file2.size).toBe(4);
        expect(safDirectory.size).toBe(8);

        const safFile = await File.pickFileAsync(safDirectory.uri);
        expect(safFile.textSync()).toBe('test');
      });

      it('allows picking files from cache directory', async () => {
        const file = await File.pickFileAsync(Paths.cache.uri);
        expect(file.exists).toBe(true);
      });

      it('allows picking directories from cache directory', async () => {
        const dir = await Directory.pickDirectoryAsync(Paths.cache.uri);
        expect(dir.exists).toBe(true);
      });
    });

    it('Creates a lazy file reference', () => {
      const file = new File('file:///path/to/file');
      expect(file.uri).toBe('file:///path/to/file');
    });

    it('Supports different slash combinations', async () => {
      expect(new File('file:/path/to/file').uri).toBe('file:///path/to/file');

      // This URL is confusing, as path is actually a hostname.
      // We can no longer throw a descriptive error in this case, since this URL scheme is also used for SAF URIs.
      // TODO: Consider bringing back the scheme validation check.
      // expect(() => new File('file://path/to/file').uri).toThrow();

      expect(new File('file://localhost/path/to/file').uri).toBe('file:///path/to/file');
      expect(new File('file:///path/to/file').uri).toBe('file:///path/to/file');
    });

    it('Accepts and correctly handles uris to files', () => {
      expect(new File('file:/path/to/file').uri).toBe('file:///path/to/file');
      expect(new File('file:/path/to/file/').uri).toBe('file:///path/to/file');
    });

    it('Accepts and correctly handles uris to directories', () => {
      expect(new Directory('file:/path/to/file').uri).toBe('file:///path/to/file/');
      expect(new Directory('file:/path/to/file/').uri).toBe('file:///path/to/file/');
    });

    it("Doesn't allow changing the uri property", () => {
      const file = new File('file:///path/to/file');
      expect(() => {
        // @ts-expect-error
        file.uri = 'file:///new/path';
      }).toThrow();
    });

    describe('When a wrong class already exists', () => {
      it("Doesn't allow operations when a file is used with an existing folder path", () => {
        const directory = new Directory(testDirectory, 'test');
        directory.create();
        const file = new File(testDirectory, 'test');
        expect(() => {
          file.textSync();
        }).toThrow();
      });

      it("Doesn't allow operations when a folder is used with an existing file path", () => {
        const file = new File(testDirectory, 'test');
        file.create();
        const directory = new Directory(testDirectory, 'test');
        expect(() => {
          directory.create();
        }).toThrow();
      });

      it('Returns exists false', () => {
        const file = new File(testDirectory, 'test');
        file.create();
        const directory = new Directory(testDirectory, 'test');
        expect(file.exists).toBe(true);
        expect(directory.exists).toBe(false);
      });
    });

    it('Allows reading files from assets', () => {
      const dir = new Directory(Paths.bundle);

      if (Platform.OS === 'ios') {
        expect(dir.list().map((i) => i.name)).toContain('Info.plist');
        expect(new File(Paths.bundle, 'Info.plist').size > 2000).toBe(true);
      } else {
        expect(dir.list().map((i) => i.name)).toContain('expo-root.pem');
        expect(new File(Paths.bundle, 'expo-root.pem').size > 1000).toBe(true);
      }
    });

    describe('Works with %, # and space characters in names', () => {
      it('Works with spaces as filename', () => {
        const outputFile = new File(testDirectory, 'my new file.txt');
        expect(outputFile.exists).toBe(false);
        outputFile.write('Hello world');
        expect(outputFile.exists).toBe(true);
        expect(outputFile.name).toBe('my new file.txt');
      });

      it('Works with spaces as directory name', () => {
        const dir = new Directory(testDirectory, 'my new folder');
        expect(dir.exists).toBe(false);
        dir.create();
        expect(dir.exists).toBe(true);
        expect(dir.name).toBe('my new folder');
      });

      it('Works with # as directory name', () => {
        const dir = new Directory(testDirectory, 'my#folder');
        expect(dir.exists).toBe(false);
        dir.create();
        expect(dir.exists).toBe(true);
        expect(dir.name).toBe('my#folder');
      });

      it('Ignores # passed in as uri path', () => {
        // note the + sign here – the first argument is first decoded if it is a file url, so the # is stripped
        const dir = new Directory(testDirectory + '/TestFolder#query');
        expect(dir.exists).toBe(false);
        dir.create();
        expect(dir.exists).toBe(true);
        expect(dir.name).toBe('TestFolder');
      });

      it('Works with # as directory name', () => {
        const dir = new Directory(testDirectory, 'my#folder');
        expect(dir.exists).toBe(false);
        dir.create();
        expect(dir.exists).toBe(true);
        expect(dir.name).toBe('my#folder');
      });

      it('Works with % as directory name', () => {
        const dir = new Directory(testDirectory, 'my%folder');
        expect(dir.exists).toBe(false);
        dir.create();
        expect(dir.exists).toBe(true);
        expect(dir.name).toBe('my%folder');
      });

      it('Works with % as file name', () => {
        const dir = new Directory(testDirectory, 'my%file.txt');
        expect(dir.exists).toBe(false);
        dir.create();
        expect(dir.exists).toBe(true);
        expect(dir.name).toBe('my%file.txt');
      });

      it('(disabled) Throws error on invalid uris passed in as argument', () => {
        // We no longer throw on url with hash passed as first argument to constructor, instead clearing the hash segment of the URL during joining paths.
        // expect(() => {
        //   // eslint-disable-next-line no-new
        //   new Directory(testDirectory + '/TestFolder%query');
        // }).toThrow();
      });
    });

    it('Writes a string to a file reference', () => {
      const outputFile = new File(testDirectory, 'file.txt');
      expect(outputFile.exists).toBe(false);
      outputFile.write('Hello world');
      expect(outputFile.exists).toBe(true);
    });

    it('Writes a string to a file reference', async () => {
      const outputFile = new File(testDirectory, 'file.txt');
      outputFile.create();
      outputFile.write(new Uint8Array([97, 98, 99]));
      expect(outputFile.exists).toBe(true);
      expect(await outputFile.bytes()).toEqual(new Uint8Array([97, 98, 99]));
      expect(outputFile.bytesSync()).toEqual(new Uint8Array([97, 98, 99]));
      expect(await outputFile.text()).toBe('abc');
      expect(outputFile.textSync()).toBe('abc');
    });

    it('Reads a string from a file reference', async () => {
      const outputFile = new File(testDirectory, 'file2.txt');
      outputFile.write('Hello world');
      expect(outputFile.exists).toBe(true);
      const content = await outputFile.text();
      expect(content).toBe('Hello world');
      const contentSync = outputFile.textSync();
      expect(contentSync).toBe('Hello world');
    });

    it('Deletes a file reference', () => {
      const outputFile = new File(testDirectory, 'file3.txt');
      outputFile.write('Hello world');
      expect(outputFile.exists).toBe(true);

      outputFile.delete();
      expect(outputFile.exists).toBe(false);
    });

    it('Throws if a file does not exist', () => {
      const file = new File('file:///path/to/file');
      expect(() => file.delete()).toThrow();
    });

    it('Creates a folder', () => {
      const folder = new Directory(testDirectory, 'newFolder');
      folder.create();
      expect(folder.exists).toBe(true);
    });

    it('Creates a folder without a slash', () => {
      const folder = new Directory(testDirectory, 'newFolder2');
      folder.create();
      expect(folder.exists).toBe(true);
    });

    it('Creates a folder with subdirectories if intermediates is set', () => {
      const folder = new Directory(testDirectory, 'some', 'subdirectory', 'here');
      folder.create({ intermediates: true });
      expect(folder.exists).toBe(true);
    });

    it('Throws en error while creating a folder with subdirectories if intermediates is not set', () => {
      const folder = new Directory(testDirectory, 'some', 'subdirectory', 'here');
      expect(() => folder.create()).toThrow();
      expect(() => folder.create({ intermediates: false })).toThrow();
      expect(folder.exists).toBe(false);
    });

    it('Creates an empty file', () => {
      const file = new File(testDirectory, 'newFolder');
      file.create();
      expect(file.exists).toBe(true);
      expect(file.textSync()).toBe('');
    });

    it('Throws an error if the file exists', () => {
      const file = new File(testDirectory, 'newFolder');
      file.create();
      expect(file.exists).toBe(true);
      expect(file.textSync()).toBe('');
    });

    it('Overwrites a file if it exists and `overwrite` is set', () => {
      const file = new File(testDirectory, 'newFolder');
      file.create();
      expect(file.exists).toBe(true);
      file.write('Hello world');
      expect(file.textSync()).toBe('Hello world');
      file.create({ overwrite: true });
      expect(file.textSync()).toBe('');
    });

    it('Deletes a folder', () => {
      const folder = new Directory(testDirectory, 'newFolder');
      folder.create();
      expect(folder.exists).toBe(true);

      folder.delete();
      expect(folder.exists).toBe(false);
    });

    it('Deletes a folder containing another folder', () => {
      const folder = new Directory(testDirectory, 'newFolder2');
      folder.create();

      const child = new Directory(folder, 'child');
      child.create();

      expect(folder.exists).toBe(true);

      folder.delete();
      expect(folder.exists).toBe(false);
    });

    describe('When copying a file', () => {
      it("Throws an error when it doesn't exist", () => {
        const src = new File(testDirectory, 'file.txt');
        const dstFolder = new Directory(testDirectory, 'destination');
        dstFolder.create();
        expect(() => src.copy(dstFolder)).toThrow();
      });

      it('Copies it to a folder', () => {
        const src = new File(testDirectory, 'file.txt');
        src.write('Hello world');
        const dstFolder = new Directory(testDirectory, 'destination');
        dstFolder.create();
        src.copy(dstFolder);
        expect(src.exists).toBe(true);
        expect(src.textSync()).toBe('Hello world');
        const dst = new File(testDirectory, '/destination/file.txt');
        expect(dst.exists).toBe(true);
        expect(dst.textSync()).toBe('Hello world');
      });

      it('Throws an error when copying to a nonexistant folder without options', () => {
        const file = new File(testDirectory, 'file.txt');
        file.write('Hello world');
        const folder = new Directory(testDirectory, 'destination');
        expect(() => file.copy(folder)).toThrow();
      });

      it('Copies it to a file', () => {
        const src = new File(testDirectory, 'file.txt');
        src.write('Hello world');
        const dst = new File(testDirectory, 'file2.txt');
        src.copy(dst);
        expect(dst.exists).toBe(true);
        expect(dst.textSync()).toBe('Hello world');
        expect(src.exists).toBe(true);
      });

      it('Can copy from cache to documents', () => {
        const src = new File(Paths.cache, 'file.txt');
        const dst = new File(Paths.document, 'file.txt');
        // cleanup
        try {
          src.delete();
        } catch {}
        try {
          dst.delete();
        } catch {}
        src.write('Hello world');
        src.copy(dst);
        expect(dst.uri).toBe(FS.documentDirectory + 'file.txt');
        expect(dst.exists).toBe(true);
        expect(dst.md5).toBe(src.md5);
      });
    });

    describe('When copying a directory', () => {
      it('copies it to a folder', () => {
        const src = new Directory(testDirectory, 'directory');
        src.create();
        const dstFolder = new Directory(testDirectory, 'destination');
        dstFolder.create();
        src.copy(dstFolder);
        expect(src.exists).toBe(true);
        expect(new Directory(testDirectory, 'destination/directory').exists).toBe(true);
      });

      it('Throws an error when copying to a nonexistant folder without options', () => {
        const file = new Directory(testDirectory, 'directory/');
        file.create();
        const folder = new Directory(testDirectory, 'some/nonexistent/directory/');
        expect(() => file.copy(folder)).toThrow();
      });

      it('Creates a copy of the directory if only the bottom level destination directory does not exist', () => {
        const file = new Directory(testDirectory, 'source/');
        file.create();
        const destination = new Directory(testDirectory, 'newDestination/');
        file.copy(destination);
        expect(destination.uri).toBe(testDirectory + 'newDestination/');
        expect(file.uri).toBe(testDirectory + 'source/');
      });

      // this should not be allowed by TS, but we can handle it anyways
      it('throws an error when copying it to a file', () => {
        const src = new Directory(testDirectory, 'directory/');
        src.create();
        const dst = new File(testDirectory, 'file2.txt');
        dst.create();
        expect(() => src.copy(dst)).toThrow();
      });
    });

    describe('When moving a file', () => {
      it("Throws an error when it doesn't exist", () => {
        const src = new File(testDirectory, 'file.txt');
        const dstFolder = new Directory(testDirectory, 'destination');
        dstFolder.create();
        expect(() => src.move(dstFolder)).toThrow();
      });

      it('moves it to a folder', () => {
        const src = new File(testDirectory, 'file.txt');
        src.write('Hello world');
        const dstFolder = new Directory(testDirectory, 'destination');
        dstFolder.create();
        src.move(dstFolder);
        expect(src.exists).toBe(true);
        const dst = new File(testDirectory, '/destination/file.txt');
        expect(src.uri).toBe(dst.uri);
        expect(dst.exists).toBe(true);
        expect(dst.textSync()).toBe('Hello world');
      });

      it('Throws an error when moving to a nonexistant folder without options', () => {
        const file = new File(testDirectory, 'file.txt');
        file.write('Hello world');
        const folder = new Directory(testDirectory, 'destination');
        expect(() => file.move(folder)).toThrow();
      });

      it('moves it to a file', () => {
        const src = new File(testDirectory, 'file.txt');
        src.write('Hello world');
        const dst = new File(testDirectory, 'file2.txt');
        src.move(dst);
        expect(dst.exists).toBe(true);
        expect(dst.textSync()).toBe('Hello world');
        expect(src.exists).toBe(true);
        expect(src.uri).toBe(dst.uri);
      });
    });

    describe('When moving a directory', () => {
      it('moves it to a folder', () => {
        const src = new Directory(testDirectory, 'directory/');
        src.create();
        const dstFolder = new Directory(testDirectory, 'destination/');
        dstFolder.create();
        src.move(dstFolder);
        expect(src.exists).toBe(true);
        const dst = new Directory(testDirectory, 'destination/directory/');
        expect(src.uri).toBe(dst.uri);
        expect(dst.exists).toBe(true);
      });

      it('Throws an error when moving to a nonexistant folder without options', () => {
        const file = new File(testDirectory, 'file.txt');
        file.write('Hello world');
        const folder = new Directory(testDirectory, 'some/nonexistent/directory/');
        expect(() => file.move(folder)).toThrow();
      });

      it('Renames the directory if only the bottom level destination directory does not exist', () => {
        const file = new Directory(testDirectory, 'source/');
        file.create();
        const folder = new Directory(testDirectory, 'newDestination/');
        file.move(folder);
        expect(file.uri).toBe(testDirectory + 'newDestination/');
      });

      // this should not be allowed by TS, but we can handle it anyways
      it('throws an error when moving it to a file', () => {
        const src = new Directory(testDirectory, 'directory/');
        src.create();
        const dst = new File(testDirectory, 'file2.txt');
        dst.create();
        expect(() => src.move(dst)).toThrow();
      });
    });

    describe('Downloads files', () => {
      it('downloads a file to a target file', async () => {
        const url = 'https://picsum.photos/id/237/200/300';
        const file = new File(testDirectory, 'image.jpeg');
        const output = await File.downloadFileAsync(url, file);
        expect(file.exists).toBe(true);
        expect(output.uri).toBe(file.uri);
      });

      it('downloads a file to a target directory', async () => {
        const url = 'https://picsum.photos/id/237/200/300';
        const directory = new Directory(testDirectory);
        const output = await File.downloadFileAsync(url, directory);

        const file = new File(
          testDirectory,
          Platform.OS === 'android' ? '300.jpg' : '237-200x300.jpg'
        );
        expect(file.exists).toBe(true);
        expect(output.uri).toBe(file.uri);
      });

      it('throws an error if destination file already exists', async () => {
        const url = 'https://picsum.photos/id/237/200/300';
        const file = new File(testDirectory, 'image.jpeg');
        file.create();
        let error;
        try {
          await File.downloadFileAsync(url, file);
        } catch (e) {
          error = e;
        }
        expect(error.message.includes('Destination already exists')).toBe(true);
      });

      it('downloads file when headers are set', async () => {
        const url = 'https://picsum.photos/id/237/200/300';
        const file = new File(testDirectory, 'image.jpeg');
        const output = await File.downloadFileAsync(url, file, { headers: { Token: '1234' } });
        expect(file.exists).toBe(true);
        expect(output.uri).toBe(file.uri);
      });

      it('Supports downloading a file using bytes', async () => {
        const url = 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf';
        const md5 = '2942bfabb3d05332b66eb128e0842cff';
        const response = await fetch(url);
        const src = new File(testDirectory, 'file.pdf');
        src.write(await response.bytes());
        expect(src.md5).toEqual(md5);
      });
    });

    describe('Computes file properties', () => {
      it('computes size', async () => {
        const file = new File(testDirectory, 'file.txt');
        file.write('Hello world');
        expect(file.size).toBe(11);
      });

      it('creationTime is earlier than modificationTime or equal', async () => {
        const file = new File(
          testDirectory,
          'creationTime_is_earlier_than_modificationTime_or_equal.txt'
        );
        file.write('Hello world');
        expect(file.creationTime).not.toBeNull();
        expect(file.modificationTime).not.toBeNull();
        expect(file.creationTime).toBeLessThanOrEqual(file.modificationTime);
      });

      it('computes md5', async () => {
        const file = new File(testDirectory, 'file.txt');
        file.write('Hello world');
        expect(file.md5).toBe('3e25960a79dbc69b674cd4ec67a72c62');
      });

      it('returns null size and md5 for nonexistent files', async () => {
        const file = new File(testDirectory, 'file2.txt');
        expect(file.size).toBe(null);
        expect(file.md5).toBe(null);
      });
    });

    describe('Computes directory properties', () => {
      it('computes size', async () => {
        const dir = new Directory(testDirectory, 'directory');
        const file = new File(testDirectory, 'directory', 'file.txt');
        file.create({ intermediates: true });
        file.write('Hello world');
        expect(dir.size).toBe(11);
      });
    });

    describe('Returns base64', () => {
      it('gets base64 of a file', async () => {
        const src = new File(testDirectory, 'file.txt');
        src.write('Hello world');
        expect(await src.base64()).toBe('SGVsbG8gd29ybGQ=');
        expect(src.base64Sync()).toBe('SGVsbG8gd29ybGQ=');
      });
    });

    describe('Returns bytes', () => {
      it('gets file as a Uint8Array', async () => {
        const src = new File(testDirectory, 'file.txt');
        src.write('Hello world');
        expect(src.bytesSync()).toEqual(
          new Uint8Array([72, 101, 108, 108, 111, 32, 119, 111, 114, 108, 100])
        );
      });
    });

    describe('Returns path info', () => {
      it('correctly if exists and is a directory', () => {
        const uri = testDirectory + 'correctly_if_exists_and_is_a_directory';
        const src = new Directory(uri);
        src.create();
        expect(Paths.info(uri)).toEqual({
          exists: true,
          isDirectory: true,
        });
      });

      it('correctly if exists and is not a directory', () => {
        const uri = testDirectory + 'correctly_if_exists_and_is_not_a_directory.txt';
        const src = new File(uri);
        src.create();
        expect(Paths.info(uri)).toEqual({
          exists: true,
          isDirectory: false,
        });
      });

      it('correctly if does not exist', () => {
        const uri = testDirectory + 'correctly_if_does_not_exist.txt';
        expect(Paths.info(uri)).toEqual({
          exists: false,
          isDirectory: null,
        });
      });
    });

    describe('Lists directory contents', () => {
      it('for newly created directories', () => {
        new File(testDirectory, 'file.txt').create();
        new Directory(testDirectory, 'directory').create();
        expect(new Directory(testDirectory).list()).toEqual([
          new File(testDirectory, 'file.txt'),
          new Directory(testDirectory, 'directory'),
        ]);
        expect(new Directory(testDirectory).list()[0] instanceof File).toBe(true);
      });
    });

    describe('JS-only properties for path manipulation', () => {
      it('return parentDirectory for files', () => {
        const file = new File(testDirectory, 'image.jpeg');
        expect(file.parentDirectory.uri).toBe(new Directory(testDirectory).uri);
      });
      it('return parentDirectory for directories', () => {
        const directory = new Directory(testDirectory, '/testdirectory/sampleDir');
        expect(directory.parentDirectory.parentDirectory.uri).toBe(
          new Directory(testDirectory).uri
        );
      });
      it('return extension for files', () => {
        expect(new File(testDirectory, 'image.jpeg').extension).toBe('.jpeg');
        expect(new File(testDirectory, 'image.pdf.jpeg').extension).toBe('.jpeg');
      });

      it('joins paths', () => {
        expect(Paths.join('file:///path', 'to', '..', 'file')).toBe('file:///path/file');
        expect(Paths.join(new Directory('file:///path'), 'to', '..', 'file')).toBe(
          'file:///path/file'
        );
      });

      it('joins paths in the File and Directory constructors', () => {
        expect(new File('file:///path', 'to', '..', 'file').uri).toBe('file:///path/file');
        expect(new Directory('file:///path', 'to', '..', 'directory').uri).toBe(
          'file:///path/directory/'
        );
      });
    });

    describe('Exposes common app directories', () => {
      it('exposes cache directory', () => {
        expect(Paths.cache instanceof Directory).toBe(true);
        expect(Paths.cache.uri).toBe(FS.cacheDirectory);
      });
      it('exposes document directory', () => {
        expect(Paths.document instanceof Directory).toBe(true);
        expect(Paths.document.uri).toBe(FS.documentDirectory);
      });
      it('can be easily used with joining paths', () => {
        const file = new File(Paths.document, 'file.txt');
        expect(file.uri).toBe(FS.documentDirectory + 'file.txt');
      });
    });

    describe('When getting file info', () => {
      it('executes correctly', () => {
        const url = `${testDirectory}execute_correctly.txt`;
        const src = new File(url);
        src.create();
        src.write('Hello World');
        const result = src.info({ md5: true });
        expect(result.exists).toBe(true);
        if (result.exists) {
          const { uri, size, modificationTime, creationTime, md5 } = result;
          expect(modificationTime).not.toBeNull();
          expect(creationTime).not.toBeNull();
          expect(md5).not.toBeNull();
          expect(uri).toBe(url);
          expect(size).toBe(11);
        }
      });
      it('executes correctly when options are undefined', () => {
        const url = `${testDirectory}executes_correctly_when_options_are_undefined.txt`;
        const src = new File(url);
        src.write('Hello World');
        const result = src.info();
        if (result.exists) {
          expect(result.md5).toBeNull();
        }
      });
      it('returns exists false if file does not exist', () => {
        const url = `${testDirectory}returns_exists_false_if_file_does_not_exist.txt`;
        const src = new File(url);
        src.write('Hello world');
        src.delete();
        const result = src.info();
        expect(result.exists).toBe(false);
      });
    });
    describe('When getting directory info', () => {
      it('executes correctly on an empty directory', () => {
        const url = `${testDirectory}executes_correctly_on_an_empty_directory/`;
        const src = new Directory(url);
        src.create();

        const result = src.info();

        expect(result.exists).toBe(true);
        expect(result.modificationTime).not.toBeNull();
        expect(result.creationTime).not.toBeNull();
        expect(result.uri).toBe(url);
        expect(result.size).toBe(0);
      });
      it('executes correctly on a non empty directory', () => {
        const url = `${testDirectory}executes_correctly_on_a_non_empty_directory/`;
        const src = new Directory(url);
        src.create();
        const file = new File(`${url}1.txt`);
        file.write('Hello world');

        const result = src.info();

        expect(result.exists).toBe(true);
        expect(result.modificationTime).not.toBeNull();
        expect(result.creationTime).not.toBeNull();
        expect(result.files).toContain('1.txt');
        expect(result.uri).toBe(url);
        expect(result.size).toBe(11);
      });
      it('returns exists false if a directory does not exist', () => {
        const url = `${testDirectory}returns_exists_false_if_a_file_does_not_exist`;
        const src = new Directory(url);
        src.create();
        src.delete();

        const result = src.info();

        expect(result.exists).toBe(false);
      });
    });
    addAppleAppGroupsTestSuiteAsync({ describe, expect, it, ...t });
  });

  describe('Exposes total filesystem sizes', () => {
    it('Returns total filesystem space', () => {
      expect(Paths.totalDiskSpace > 100000).toBe(true);
    });
    it('Returns available filesystem space', () => {
      expect(Paths.availableDiskSpace > 100000).toBe(true);
    });
  });

  describe('Exposes file handles', () => {
    it('Allows opening files', () => {
      const src = new File(testDirectory, 'file.txt');
      src.write('Hello world');
      const handle = src.open();
      expect(handle.readBytes(4)).toEqual(new Uint8Array([72, 101, 108, 108])); // Hell
      expect(handle.readBytes(4)).toEqual(new Uint8Array([111, 32, 119, 111])); // o wo
      handle.offset = 2;
      expect(handle.readBytes(2)).toEqual(new Uint8Array([108, 108])); // ll
      expect(handle.offset).toBe(4);
      handle.close();
    });

    it('Resets position on close', () => {
      const src = new File(testDirectory, 'file.txt');
      src.write('abcde');
      let handle = src.open();
      expect(handle.readBytes(1)).toEqual(new Uint8Array([97])); // a
      handle.close();
      handle = src.open();
      expect(handle.readBytes(1)).toEqual(new Uint8Array([97])); // a
      handle.close();
    });

    it('Throws on reading from closed handle', () => {
      const src = new File(testDirectory, 'file.txt');
      src.write('abcde');
      const handle = src.open();
      expect(handle.readBytes(1)).toEqual(new Uint8Array([97])); // a
      handle.close();
      expect(() => handle.readBytes(1)).toThrow();
    });

    it('Can open multiple handles to the same file', () => {
      const src = new File(testDirectory, 'file.txt');
      src.write('abcde');
      const handle = src.open();
      const handle2 = src.open();
      expect(handle.readBytes(1)).toEqual(new Uint8Array([97])); // a
      expect(handle2.readBytes(1)).toEqual(new Uint8Array([97])); // a
    });

    it('Returns null offset on closed handle', () => {
      const src = new File(testDirectory, 'file.txt');
      src.write('abcde');
      const handle = src.open();
      handle.close();
      expect(handle.offset).toBe(null);
    });

    it('Returns null size on closed handle', () => {
      const src = new File(testDirectory, 'file.txt');
      src.write('abcde');
      const handle = src.open();
      handle.close();
      expect(handle.size).toBe(null);
    });

    it('Returns smaller than expected array when reading end of file', () => {
      const src = new File(testDirectory, 'file.txt');
      src.create();
      const handle = src.open();
      expect(handle.readBytes(2)).toEqual(new Uint8Array([])); // a
      handle.close();
      src.write('abcde');
      const handle2 = src.open();
      expect(handle2.readBytes(1)).toEqual(new Uint8Array([97])); // a
      handle2.close();
    });

    it('Reads a file in chunks', () => {
      const src = new File(testDirectory, 'abcs.txt');
      const alphabet = 'abcdefghijklmnopqrstuvwxyz';
      src.write(alphabet.repeat(1000) + 'ending');
      const handle = src.open();
      for (let i = 0; i < 250; i++) {
        const chunk = handle.readBytes(26 * 4);
        expect(chunk.length).toBe(26 * 4);
        expect(String.fromCharCode(...chunk)).toBe(alphabet.repeat(4));
      }
      const chunk = handle.readBytes(100);
      expect(chunk.length).toBe(6);
      expect(String.fromCharCode(...chunk)).toBe('ending');
      handle.close();
    });

    it('Writes to a file handle', () => {
      const src = new File(testDirectory, 'abcs.txt');
      const alphabet = 'abcdefghijklmnopqrstuvwxyz';
      src.create();
      const handle = src.open();
      for (let i = 0; i < 10; i++) {
        handle.writeBytes(
          new Uint8Array(
            alphabet
              .repeat(4)
              .split('')
              .map((char) => char.charCodeAt(0))
          )
        );
      }
      expect(handle.readBytes(26 * 4).length).toBe(0);
      handle.offset = 0;
      expect(handle.readBytes(26 * 4).length).toBe(26 * 4);
      handle.close();
      expect(src.textSync()).toBe(alphabet.repeat(4 * 10));
    });

    it('Provides a ReadableStream', async () => {
      const src = new File(testDirectory, 'abcs.txt');
      const alphabet = 'abcdefghijklmnopqrstuvwxyz';
      src.write(alphabet);
      const stream = src.readableStream();
      for await (const chunk of stream) {
        expect(chunk[0]).toBe(alphabet.charCodeAt(0));
      }
    });

    it('Provides a ReadableStream with byob support', async () => {
      const src = new File(testDirectory, 'abcs.txt');
      const alphabet = 'abcdefghij'.repeat(1000);
      src.write(alphabet);
      const stream = src.readableStream();
      const array1 = new Uint8Array(5000);
      const array2 = new Uint8Array(5000);
      const array3 = new Uint8Array(50);
      const reader = stream.getReader({ mode: 'byob' });
      expect((await reader.read(array1)).done).toBe(false);
      const result = await reader.read(array2);
      expect(result.done).toBe(false);
      expect(result.value[4999]).toBe(alphabet.charCodeAt(9999));

      const result2 = await reader.read(array3);
      expect(result2.done).toBe(true);
      expect(result2.value.length).toBe(0);
    });

    it('Provides a WriteableStream', async () => {
      const src = new File(testDirectory, 'abcs.txt');
      src.create();
      const writable = src.writableStream();
      const alphabet = 'abcdefghij'.repeat(10);
      const writer = writable.getWriter();
      await writer.write(new Uint8Array(alphabet.split('').map((char) => char.charCodeAt(0))));
      writer.close();
      expect(src.textSync()).toBe(alphabet);
    });

    it('Returns correct file type', async () => {
      const asset = await Asset.fromModule(require('../assets/qrcode_expo.jpg')).downloadAsync();
      const src = new File(asset.localUri);
      expect(src.type).toBe('image/jpeg');
      const src2 = new File(testDirectory, 'file.txt');
      src2.write('abcde');
      expect(src2.type).toBe('text/plain');
    });

    // You can also use something like container twostoryrobot/simple-file-upload to test if the file is saved correctly
    it('Supports sending a file using blob', async () => {
      const src = new File(testDirectory, 'file.txt');
      src.write('abcde');

      const response = await fetch('https://httpbingo.org/anything', {
        method: 'POST',
        body: src,
      });
      const body = await response.json();
      expect(body.data).toEqual('abcde');
    });

    // You can also use this docker image: twostoryrobot/simple-file-upload to test e2e blob upload.
    it('Supports sending a file using blob with formdata', async () => {
      const src = new File(testDirectory, 'file.txt');
      src.write('abcde');

      const formData = new FormData();

      formData.append('data', src);

      const response = await fetch('https://httpbingo.org/anything', {
        method: 'POST',
        body: formData,
      });
      const body = await response.json();
      expect(body.files.data[0]).toEqual('abcde');
    });

    it('Supports sending a named file blob using blob with formdata', async () => {
      const src = new File(testDirectory, 'file.txt');
      src.write('abcde');

      const formData = new FormData();

      formData.append('data', src, 'FileName.txt');

      const response = await fetch('https://httpbingo.org/anything', {
        method: 'POST',
        body: formData,
      });
      const body = await response.json();
      // TODO: This is the expected behavior, but following [spec](https://html.spec.whatwg.org/multipage/form-control-infrastructure.html#create-an-entry)
      // would require us to create a new File object when setting filename – we could make it work only if File is available in (global.expo)
      // expect(body.data.match(/filename="([^"]+)"/)[1]).toEqual('FileName.txt');

      // this is invalid
      expect(body.data.match(/filename="([^"]+)"/)[1]).toEqual('file.txt');
    });
  });

  addAppleAppGroupsTestSuiteAsync({ describe, expect, it, ...t });
}

function addAppleAppGroupsTestSuiteAsync({ describe, expect, it, ...t }) {
  const firstContainer = Object.values(Paths.appleSharedContainers)?.[0];
  const sharedContainerTestDir = firstContainer ? firstContainer.uri + 'test/' : null;
  const scopedIt = sharedContainerTestDir ? it : t.xit;

  describe('Apple App Group', () => {
    t.beforeEach(async () => {
      if (sharedContainerTestDir) {
        await FS.makeDirectoryAsync(sharedContainerTestDir, { intermediates: true });
      }
    });

    t.afterEach(async () => {
      if (sharedContainerTestDir) {
        await FS.deleteAsync(sharedContainerTestDir, { idempotent: true });
      }
    });

    scopedIt('Writes a string to a file reference', () => {
      const outputFile = new File(sharedContainerTestDir, 'file.txt');
      expect(outputFile.exists).toBe(false);
      outputFile.write('Hello world');
      expect(outputFile.exists).toBe(true);
    });

    scopedIt('Deletes a file reference', () => {
      const outputFile = new File(sharedContainerTestDir, 'file3.txt');
      outputFile.write('Hello world');
      expect(outputFile.exists).toBe(true);

      outputFile.delete();
      expect(outputFile.exists).toBe(false);
    });

    scopedIt('Creates a folder', () => {
      const folder = new Directory(sharedContainerTestDir, 'newFolder');
      folder.create();
      expect(folder.exists).toBe(true);
    });

    scopedIt('Deletes a folder', () => {
      const folder = new Directory(sharedContainerTestDir, 'newFolder');
      folder.create();
      expect(folder.exists).toBe(true);

      folder.delete();
      expect(folder.exists).toBe(false);
    });
  });
}
