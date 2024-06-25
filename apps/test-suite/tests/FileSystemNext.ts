'use strict';
import * as FS from 'expo-file-system';
import { File, Directory } from 'expo-file-system/next';

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
    it('Creates a lazy file reference', async () => {
      const file = new File('file://path/to/file');
      expect(file.path).toBe('file://path/to/file');
    });

    it('Allows changing the path property', async () => {
      const file = new File('file://path/to/file');
      expect(file.path).toBe('file://path/to/file');
      file.path = 'file://new/path';
      expect(file.path).toBe('file://new/path');
    });

    it('Writes a string to a file reference', async () => {
      // Not doing concating path segments in constructor, to make sure the second argument can be an options dict.
      // Instead, we want to provide utilties for it in a path object.
      const outputFile = new File(testDirectory + 'file.txt');
      expect(outputFile.exists()).toBe(false);
      outputFile.write('Hello world');
      expect(outputFile.exists()).toBe(true);
    });

    it('Reads a string from a file reference', async () => {
      const outputFile = new File(testDirectory + 'file2.txt');
      outputFile.write('Hello world');
      expect(outputFile.exists()).toBe(true);
      const content = outputFile.text();
      expect(content).toBe('Hello world');
    });

    it('Deletes a file reference', async () => {
      const outputFile = new File(testDirectory + 'file3.txt');
      outputFile.write('Hello world');
      expect(outputFile.exists()).toBe(true);

      outputFile.delete();
      expect(outputFile.exists()).toBe(false);
    });

    it('Creates a folder', async () => {
      const folder = new Directory(testDirectory + 'newFolder/');
      folder.create();
      expect(folder.exists()).toBe(true);
    });

    it("Doesn't create a folder without a slash", async () => {
      expect(() => {
        // eslint-disable-next-line no-new
        new Directory(testDirectory + 'newFolder2');
      }).toThrow();
    });

    it('Creates an empty file', async () => {
      const file = new File(testDirectory + 'newFolder');
      file.create();
      expect(file.exists()).toBe(true);
      expect(file.text()).toBe('');
    });
  });
}
