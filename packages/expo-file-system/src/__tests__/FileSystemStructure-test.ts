import fs from 'node:fs';
import path from 'node:path';

const srcDir = path.resolve(__dirname, '..');

function listSourceFiles(dir: string): string[] {
  return fs
    .readdirSync(dir, { withFileTypes: true })
    .flatMap((entry) => {
      const entryPath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        if (entry.name === '__tests__' || entry.name === 'legacy') {
          return [];
        }
        return listSourceFiles(entryPath);
      }
      return entry.name.endsWith('.ts') ? [entryPath] : [];
    })
    .sort();
}

describe('expo-file-system source organization', () => {
  it('does not use ExpoFileSystem.types as an implementation dependency', () => {
    const offenders = listSourceFiles(srcDir)
      .filter((file) => path.basename(file) !== 'ExpoFileSystem.types.ts')
      .filter((file) => fs.readFileSync(file, 'utf8').includes('ExpoFileSystem.types'));

    expect(offenders.map((file) => path.relative(srcDir, file))).toEqual([]);
  });

  it('keeps File.pickFileAsync public overloads on the public File class', () => {
    const fileSource = fs.readFileSync(path.join(srcDir, 'File.ts'), 'utf8');

    expect(fileSource).toContain(
      'static pickFileAsync(options?: PickSingleFileOptions): Promise<PickSingleFileResult>;'
    );
    expect(fileSource).toContain(
      'static pickFileAsync(options?: PickMultipleFilesOptions): Promise<PickMultipleFilesResult>;'
    );
    expect(fileSource).toContain(
      'static pickFileAsync(initialUri?: string, mimeType?: string): Promise<File | File[]>;'
    );
    expect(fileSource).toContain(
      '@deprecated Use `pickFileAsync({initialUri, mimeTypes: mimeType})` instead.'
    );
  });
});
