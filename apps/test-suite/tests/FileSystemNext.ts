'use strict';
import * as FS from 'expo-file-system';
import { File, Directory } from 'expo-file-system/next';
import { Paths } from 'expo-file-system/src/next';
import { Platform } from 'react-native';

export const name = 'FileSystem@next';

export async function test({ describe, expect, it, ...t }) {
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

  describe('FileSystem (Next)', () => {
    it('Creates a lazy file reference', () => {
      const file = new File('file:///path/to/file');
      expect(file.uri).toBe('file:///path/to/file');
    });

    it('Supports different slash combinations', async () => {
      expect(new File('file:/path/to/file').uri).toBe('file:///path/to/file');
      // FirstDirectory is a host when url parsing.
      expect(new File('file://firstDirectory/to/file').uri).toBe('file:///to/file');
      expect(new File('file:/path/to/file').uri).toBe('file:///path/to/file');
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
        const directory = new Directory(testDirectory + 'test');
        directory.create();
        const file = new File(testDirectory + 'test');
        expect(() => {
          file.text();
        }).toThrow();
      });

      it("Doesn't allow operations when a folder is used with an existing file path", () => {
        const file = new File(testDirectory + 'test');
        file.create();
        const directory = new Directory(testDirectory + 'test');
        expect(() => {
          directory.create();
        }).toThrow();
      });

      it('Returns exists false', () => {
        const file = new File(testDirectory + 'test');
        file.create();
        const directory = new Directory(testDirectory + 'test');
        expect(file.exists).toBe(true);
        expect(directory.exists).toBe(false);
      });
    });

    it('Writes a string to a file reference', () => {
      // Not doing concating path segments in constructor, to make sure the second argument can be an options dict.
      // Instead, we want to provide utilties for it in a path object.
      const outputFile = new File(testDirectory + 'file.txt');
      expect(outputFile.exists).toBe(false);
      outputFile.write('Hello world');
      expect(outputFile.exists).toBe(true);
    });

    it('Reads a string from a file reference', () => {
      const outputFile = new File(testDirectory + 'file2.txt');
      outputFile.write('Hello world');
      expect(outputFile.exists).toBe(true);
      const content = outputFile.text();
      expect(content).toBe('Hello world');
    });

    it('Deletes a file reference', () => {
      const outputFile = new File(testDirectory + 'file3.txt');
      outputFile.write('Hello world');
      expect(outputFile.exists).toBe(true);

      outputFile.delete();
      expect(outputFile.exists).toBe(false);
    });

    it('Creates a folder', () => {
      const folder = new Directory(testDirectory + 'newFolder');
      folder.create();
      expect(folder.exists).toBe(true);
    });

    it('Creates a folder without a slash', () => {
      const folder = new Directory(testDirectory + 'newFolder2');
      folder.create();
      expect(folder.exists).toBe(true);
    });

    it('Creates an empty file', () => {
      const file = new File(testDirectory + 'newFolder');
      file.create();
      expect(file.exists).toBe(true);
      expect(file.text()).toBe('');
    });

    it('Deletes a folder', () => {
      const folder = new Directory(testDirectory + 'newFolder');
      folder.create();
      expect(folder.exists).toBe(true);

      folder.delete();
      expect(folder.exists).toBe(false);
    });

    describe('When copying a file', () => {
      it("Throws an error when it doesn't exist", () => {
        const src = new File(testDirectory + 'file.txt');
        const dstFolder = new Directory(testDirectory + 'destination');
        dstFolder.create();
        expect(() => src.copy(dstFolder)).toThrow();
      });

      it('Copies it to a folder', () => {
        const src = new File(testDirectory + 'file.txt');
        src.write('Hello world');
        const dstFolder = new Directory(testDirectory + 'destination');
        dstFolder.create();
        src.copy(dstFolder);
        expect(src.exists).toBe(true);
        expect(src.text()).toBe('Hello world');
        const dst = new File(testDirectory + '/destination/file.txt');
        expect(dst.exists).toBe(true);
        expect(dst.text()).toBe('Hello world');
      });

      it('Throws an error when copying to a nonexistant folder without options', () => {
        const file = new File(testDirectory + 'file.txt');
        file.write('Hello world');
        const folder = new Directory(testDirectory + 'destination');
        expect(() => file.copy(folder)).toThrow();
      });

      it('Copies it to a file', () => {
        const src = new File(testDirectory + 'file.txt');
        src.write('Hello world');
        const dst = new File(testDirectory + 'file2.txt');
        src.copy(dst);
        expect(dst.exists).toBe(true);
        expect(dst.text()).toBe('Hello world');
        expect(src.exists).toBe(true);
      });
    });

    describe('When copying a directory', () => {
      it('copies it to a folder', () => {
        const src = new Directory(testDirectory + 'directory');
        src.create();
        const dstFolder = new Directory(testDirectory + 'destination');
        dstFolder.create();
        src.copy(dstFolder);
        expect(src.exists).toBe(true);
        expect(new Directory(testDirectory + 'destination/directory').exists).toBe(true);
      });

      it('Throws an error when copying to a nonexistant folder without options', () => {
        const file = new Directory(testDirectory + 'directory/');
        file.create();
        const folder = new Directory(testDirectory + 'destination/');
        expect(() => file.copy(folder)).toThrow();
      });

      it('throws an error when copying it to a file', () => {
        const src = new Directory(testDirectory + 'directory/');
        src.create();
        const dst = new File(testDirectory + 'file2.txt');
        dst.create();
        expect(() => src.copy(dst)).toThrow();
      });
    });

    describe('When moving a file', () => {
      it("Throws an error when it doesn't exist", () => {
        const src = new File(testDirectory + 'file.txt');
        const dstFolder = new Directory(testDirectory + 'destination');
        dstFolder.create();
        expect(() => src.move(dstFolder)).toThrow();
      });

      it('moves it to a folder', () => {
        const src = new File(testDirectory + 'file.txt');
        src.write('Hello world');
        const dstFolder = new Directory(testDirectory + 'destination');
        dstFolder.create();
        src.move(dstFolder);
        expect(src.exists).toBe(true);
        const dst = new File(testDirectory + '/destination/file.txt');
        expect(src.uri).toBe(dst.uri);
        expect(dst.exists).toBe(true);
        expect(dst.text()).toBe('Hello world');
      });

      it('Throws an error when moving to a nonexistant folder without options', () => {
        const file = new File(testDirectory + 'file.txt');
        file.write('Hello world');
        const folder = new Directory(testDirectory + 'destination');
        expect(() => file.move(folder)).toThrow();
      });

      it('moves it to a file', () => {
        const src = new File(testDirectory + 'file.txt');
        src.write('Hello world');
        const dst = new File(testDirectory + 'file2.txt');
        src.move(dst);
        expect(dst.exists).toBe(true);
        expect(dst.text()).toBe('Hello world');
        expect(src.exists).toBe(true);
        expect(src.uri).toBe(dst.uri);
      });
    });

    describe('When moving a directory', () => {
      it('moves it to a folder', () => {
        const src = new Directory(testDirectory + 'directory');
        src.create();
        const dstFolder = new Directory(testDirectory + 'destination');
        dstFolder.create();
        src.move(dstFolder);
        expect(src.exists).toBe(true);
        const dst = new Directory(testDirectory + 'destination/directory');
        expect(src.uri).toBe(dst.uri);
        expect(dst.exists).toBe(true);
      });

      it('Throws an error when moving to a nonexistant folder without options', () => {
        const file = new Directory(testDirectory + 'directory/');
        file.create();
        const folder = new Directory(testDirectory + 'destination/');
        expect(() => file.move(folder)).toThrow();
      });

      it('throws an error when moving it to a file', () => {
        const src = new Directory(testDirectory + 'directory/');
        src.create();
        const dst = new File(testDirectory + 'file2.txt');
        dst.create();
        expect(() => src.move(dst)).toThrow();
      });
    });

    describe('Downloads files', () => {
      it('downloads a file to a target file', async () => {
        const url = 'https://picsum.photos/id/237/200/300';
        const file = new File(testDirectory + 'image.jpeg');
        const output = await File.downloadFileAsync(url, file);
        expect(file.exists).toBe(true);
        expect(output.uri).toBe(file.uri);
      });

      it('downloads a file to a target directory', async () => {
        const url = 'https://picsum.photos/id/237/200/300';
        const directory = new Directory(testDirectory);
        const output = await File.downloadFileAsync(url, directory);

        const file = new File(
          testDirectory + (Platform.OS === 'android' ? '300.jpg' : '237-200x300.jpg')
        );
        expect(file.exists).toBe(true);
        expect(output.uri).toBe(file.uri);
      });
    });

    describe('Computes file properties', () => {
      it('computes size', async () => {
        const file = new File(testDirectory + 'file.txt');
        file.write('Hello world');
        expect(file.size).toBe(11);
      });

      it('computes md5', async () => {
        const file = new File(testDirectory + 'file.txt');
        file.write('Hello world');
        expect(file.md5).toBe('3e25960a79dbc69b674cd4ec67a72c62');
      });

      it('returns null size and md5 for nonexistent files', async () => {
        const file = new File(testDirectory + 'file2.txt');
        expect(file.size).toBe(null);
        expect(file.md5).toBe(null);
      });

      it('computes md5', async () => {
        const file = new File(testDirectory + 'file.txt');
        file.write('Hello world');
        expect(file.md5).toBe('3e25960a79dbc69b674cd4ec67a72c62');
      });
    });

    describe('Returns base64', () => {
      it('gets base64 of a file', async () => {
        const src = new File(testDirectory + 'file.txt');
        src.write('Hello world');
        expect(src.base64()).toBe('SGVsbG8gd29ybGQ=');
      });
    });

    describe('Lists directory contents', () => {
      it('for newly created directories', () => {
        new File(testDirectory + 'file.txt').create();
        new Directory(testDirectory + 'directory').create();
        expect(new Directory(testDirectory).list()).toEqual([
          new File(testDirectory + 'file.txt'),
          new Directory(testDirectory + 'directory'),
        ]);
        expect(new Directory(testDirectory).list()[0] instanceof File).toBe(true);
      });
    });

    describe('JS-only properties for path manipulation', () => {
      it('return parentDirectory for files', () => {
        const file = new File(testDirectory + 'image.jpeg');
        expect(file.parentDirectory.uri).toBe(new Directory(testDirectory).uri);
      });
      it('return parentDirectory for directories', () => {
        const directory = new Directory(testDirectory + '/testdirectory/sampleDir');
        expect(directory.parentDirectory.parentDirectory.uri).toBe(
          new Directory(testDirectory).uri
        );
      });
      it('return extension for files', () => {
        expect(new File(testDirectory + 'image.jpeg').extension).toBe('.jpeg');
        expect(new File(testDirectory + 'image.pdf.jpeg').extension).toBe('.jpeg');
      });

      it('joins paths', () => {
        expect(Paths.join('file:///path', 'to', '..', 'file')).toBe('file:///path/file');
      });
    });
  });
}
