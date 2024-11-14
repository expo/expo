'use strict';
import Constants from 'expo-constants';
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
    if (Constants.appOwnership === 'expo') {
      describe('managed workflow', () => {
        it('throws exceptions on constructors', () => {
          expect(() => {
            // eslint-disable-next-line no-new
            new File('file:///path/to/file');
          }).toThrow();
          expect(() => {
            // eslint-disable-next-line no-new
            new Directory('file:///path/to/file');
          }).toThrow();
        });
        // Not used now as the module is disabled in managed workflow
        // it('throws out-of-scope exceptions', async () => {
        //   expect(() => {
        //     new File(Paths.document, '..', 'file.txt').create();
        //   }).toThrow();
        //   expect(() => {
        //     new File(Paths.document, '..', 'file.txt').text();
        //   }).toThrow();
        //   expect(() => {
        //     new File(Paths.document, '..', 'file.txt').copy(new File(Paths.document, 'file.txt'));
        //   }).toThrow();
        // });
      });
    } else {
      it('Creates a lazy file reference', () => {
        const file = new File('file:///path/to/file');
        expect(file.uri).toBe('file:///path/to/file');
      });

      it('Supports different slash combinations', async () => {
        expect(new File('file:/path/to/file').uri).toBe('file:///path/to/file');
        // This URL is confusing, as path is actually a hostname.
        // We throw a descriptive error in this case.
        expect(() => new File('file://path/to/file').uri).toThrow();

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
            file.text();
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

      it('Writes a string to a file reference', () => {
        const outputFile = new File(testDirectory, 'file.txt');
        expect(outputFile.exists).toBe(false);
        outputFile.write('Hello world');
        expect(outputFile.exists).toBe(true);
      });

      it('Writes a string to a file reference', () => {
        const outputFile = new File(testDirectory, 'file.txt');
        outputFile.create();
        outputFile.write(new Uint8Array([97, 98, 99]));
        expect(outputFile.exists).toBe(true);
        expect(outputFile.bytes()).toEqual(new Uint8Array([97, 98, 99]));
        expect(outputFile.text()).toBe('abc');
      });

      it('Reads a string from a file reference', () => {
        const outputFile = new File(testDirectory, 'file2.txt');
        outputFile.write('Hello world');
        expect(outputFile.exists).toBe(true);
        const content = outputFile.text();
        expect(content).toBe('Hello world');
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
        expect(file.text()).toBe('');
      });

      it('Throws an error if the file exists', () => {
        const file = new File(testDirectory + 'newFolder');
        file.create();
        expect(file.exists).toBe(true);
        expect(file.text()).toBe('');
      });

      it('Overwrites a file if it exists and `overwrite` is set', () => {
        const file = new File(testDirectory + 'newFolder');
        file.create();
        expect(file.exists).toBe(true);
        file.write('Hello world');
        expect(file.text()).toBe('Hello world');
        file.create({ overwrite: true });
        expect(file.text()).toBe('');
      });

      it('Deletes a folder', () => {
        const folder = new Directory(testDirectory, 'newFolder');
        folder.create();
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
          expect(src.text()).toBe('Hello world');
          const dst = new File(testDirectory, '/destination/file.txt');
          expect(dst.exists).toBe(true);
          expect(dst.text()).toBe('Hello world');
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
          expect(dst.text()).toBe('Hello world');
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
          // @ts-expect-error
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
          expect(dst.text()).toBe('Hello world');
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
          expect(dst.text()).toBe('Hello world');
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
          // @ts-expect-error
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
      });

      describe('Computes file properties', () => {
        it('computes size', async () => {
          const file = new File(testDirectory, 'file.txt');
          file.write('Hello world');
          expect(file.size).toBe(11);
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

        it('computes md5', async () => {
          const file = new File(testDirectory, 'file.txt');
          file.write('Hello world');
          expect(file.md5).toBe('3e25960a79dbc69b674cd4ec67a72c62');
        });
      });

      describe('Returns base64', () => {
        it('gets base64 of a file', async () => {
          const src = new File(testDirectory, 'file.txt');
          src.write('Hello world');
          expect(src.base64()).toBe('SGVsbG8gd29ybGQ=');
        });
      });

      describe('Returns bytes', () => {
        it('gets file as a Uint8Array', async () => {
          const src = new File(testDirectory, 'file.txt');
          src.write('Hello world');
          expect(src.bytes()).toEqual(
            new Uint8Array([72, 101, 108, 108, 111, 32, 119, 111, 114, 108, 100])
          );
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

      addAppleAppGroupsTestSuiteAsync({ describe, expect, it, ...t });
    }
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
      expect(src.text()).toBe(alphabet.repeat(4 * 10));
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
      expect(src.text()).toBe(alphabet);
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
