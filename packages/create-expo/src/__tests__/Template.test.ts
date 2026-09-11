import fs from 'fs';
import * as Glob from 'glob';
import path from 'path';

import {
  getTemplateFilesToRenameAsync,
  resolvePackageModuleId,
  renameTemplateAppNameAsync,
} from '../Template';

jest.mock('fs');
jest.mock('glob');
const ActualFs = jest.requireActual('fs') as typeof fs;
const ActualGlob = jest.requireActual('glob') as typeof Glob;
const cwd = path.resolve(__dirname, 'fixtures/contrived-template');

describe(resolvePackageModuleId, () => {
  it(`resolves 'file:' path`, () => {
    const result = resolvePackageModuleId('file:./path/to/template.tgz');
    expect(result).toEqual({
      type: 'file',
      uri: expect.stringMatching('./path/to/template.tgz'),
    });
    expect(result.type === 'file' && path.isAbsolute(result.uri)).toBe(true);
  });
  it(`resolves darwin local path`, () => {
    expect(resolvePackageModuleId('./path/to/template.tgz')).toEqual({
      type: 'file',
      uri: expect.stringMatching('./path/to/template.tgz'),
    });
  });
  it(`resolves windows local path`, () => {
    expect(resolvePackageModuleId('.\\path\\to\\template.tgz')).toEqual({
      type: 'file',
      uri: expect.stringMatching(/template\.tgz$/),
    });
  });
  it(`resolves module ID`, () => {
    expect(resolvePackageModuleId('@expo/basic@34.0.0')).toEqual({
      type: 'npm',
      uri: '@expo/basic@34.0.0',
    });
    expect(resolvePackageModuleId('basic')).toEqual({
      type: 'npm',
      uri: 'basic',
    });
  });
  it('resolves github shorthand', () => {
    expect(resolvePackageModuleId('expo/template-example')).toMatchObject({
      type: 'repository',
      uri: expect.objectContaining({
        href: 'https://github.com/expo/template-example',
      }),
    });
  });
  it('resolves GitHub shorthand with repository path', () => {
    expect(
      resolvePackageModuleId('expo/expo/tree/sdk-49/templates/expo-template-bare-minimum')
    ).toMatchObject({
      type: 'repository',
      uri: expect.objectContaining({
        href: 'https://github.com/expo/expo/tree/sdk-49/templates/expo-template-bare-minimum',
      }),
    });
  });
  it('resolves github repository url', () => {
    expect(
      resolvePackageModuleId(
        'https://github.com/expo/expo/tree/sdk-49/templates/expo-template-bare-minimum'
      )
    ).toMatchObject({
      type: 'repository',
      uri: expect.objectContaining({
        pathname: '/expo/expo/tree/sdk-49/templates/expo-template-bare-minimum',
      }),
    });
  });
});

describe('getTemplateFilesToRenameAsync', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns no files when passed an empty rename config', async () => {
    const spyGlob = jest.spyOn(Glob, 'glob').mockImplementation(async (source, options) => {
      return await ActualGlob.glob(source, { ...options, fs: ActualFs });
    });

    const files = await getTemplateFilesToRenameAsync({ cwd, renameConfig: [] });
    expect(files).toHaveLength(0);
    expect(spyGlob).toHaveBeenCalledTimes(1);
  });
});

describe('getTemplateFilesToRenameAsync — nested patterns via custom rename config', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('lets a template-supplied config reach app.json files inside apps/*', async () => {
    const monorepoFixture = path.resolve(__dirname, 'fixtures/monorepo-template');
    jest
      .spyOn(Glob, 'glob')
      .mockImplementation(async (source, options) =>
        ActualGlob.glob(source, { ...options, fs: ActualFs })
      );

    // Fixture is created on-demand below if it doesn't already exist.
    await ActualFs.promises.mkdir(path.join(monorepoFixture, 'apps/mobile'), { recursive: true });
    await ActualFs.promises.mkdir(path.join(monorepoFixture, 'apps/tv'), { recursive: true });
    await ActualFs.promises.writeFile(
      path.join(monorepoFixture, 'apps/mobile/app.json'),
      '{ "name": "HelloWorld" }'
    );
    await ActualFs.promises.writeFile(
      path.join(monorepoFixture, 'apps/tv/app.json'),
      '{ "name": "HelloWorld" }'
    );

    try {
      const files = await getTemplateFilesToRenameAsync({
        cwd: monorepoFixture,
        renameConfig: ['apps/*/app.json'],
      });
      expect(files.sort()).toEqual(['apps/mobile/app.json', 'apps/tv/app.json']);
    } finally {
      await ActualFs.promises.rm(monorepoFixture, { recursive: true, force: true });
    }
  });
});

describe('renameTemplateAppNameAsync', () => {
  // All templates start as "HelloWorld" by convention and, through this
  // function, can be renamed to the user's preference (e.g. to ByeWorld).

  describe('config behaviour', () => {
    beforeEach(() => {
      jest.clearAllMocks();
    });

    it('skips renaming when explicitly passed an empty rename config', async () => {
      // No need to mock fs.readFile/writeFile this time, as we'll be asserting
      // that they weren't called in the first place!
      const spyReadFile = jest.spyOn(fs.promises, 'readFile');
      const spyWriteFile = jest.spyOn(fs.promises, 'writeFile');

      await renameTemplateAppNameAsync({ cwd, files: [], name: 'ByeWorld' });

      // We expect readFile to not have been called, as passing an empty
      // renameConfig should cause an empty set of patterns to be passed to
      // glob.
      expect(spyReadFile).not.toHaveBeenCalled();

      // As no files were read, none should be overwritten, either.
      expect(spyWriteFile).not.toHaveBeenCalled();
    });

    it('renames files containing the "HelloWorld" string', async () => {
      const spyReadFile = jest
        .spyOn(fs.promises, 'readFile')
        .mockImplementation(async (filePath, _encoding) => {
          switch (path.basename(filePath as string)) {
            case 'app.json': {
              return '{ "expo": { "name": "HelloWorld" } }';
            }
          }

          throw new Error(`Accessed unexpected file: ${filePath}`);
        });

      const spyWriteFile = jest
        .spyOn(fs.promises, 'writeFile')
        .mockImplementation(async (_filePath, data) => {
          expect(data).toMatch('{ "expo": { "name": "ByeWorld" } }');
        });

      await renameTemplateAppNameAsync({ cwd, files: ['app.json'], name: 'ByeWorld' });

      expect(spyReadFile).toHaveBeenCalledTimes(1);
      expect(spyWriteFile).toHaveBeenCalledTimes(1);
    });
  });

  describe('renaming behaviour', () => {
    beforeEach(() => {
      jest.clearAllMocks();
    });

    it('renames app names in camelCase', async () => {
      const spyReadFile = jest
        .spyOn(fs.promises, 'readFile')
        .mockImplementation(async (_filePath, _encoding) => 'HelloWorld');

      const spyWriteFile = jest
        .spyOn(fs.promises, 'writeFile')
        .mockImplementation(async (filePath, data) => {
          expect(path.basename(filePath as string)).toBe('app.json');
          expect(data).toMatch('ByeWorld');
        });

      await renameTemplateAppNameAsync({ cwd, files: ['app.json'], name: 'ByeWorld' });

      expect(spyReadFile).toHaveBeenCalledTimes(1);
      expect(spyWriteFile).toHaveBeenCalledTimes(1);
    });

    it('renames app names in lowercase', async () => {
      const spyReadFile = jest
        .spyOn(fs.promises, 'readFile')
        .mockImplementation(async (_filePath, _encoding) => 'helloworld');

      const spyWriteFile = jest
        .spyOn(fs.promises, 'writeFile')
        .mockImplementation(async (filePath, data) => {
          expect(path.basename(filePath as string)).toBe('app.json');
          expect(data).toMatch('byeworld');
        });

      await renameTemplateAppNameAsync({ cwd, files: ['app.json'], name: 'ByeWorld' });

      expect(spyReadFile).toHaveBeenCalledTimes(1);
      expect(spyWriteFile).toHaveBeenCalledTimes(1);
    });

    it('renames the app display name', async () => {
      const spyReadFile = jest
        .spyOn(fs.promises, 'readFile')
        .mockImplementation(async (_filePath, _encoding) => 'Hello App Display Name');

      const spyWriteFile = jest
        .spyOn(fs.promises, 'writeFile')
        .mockImplementation(async (filePath, data) => {
          expect(path.basename(filePath as string)).toBe('app.json');
          expect(data).toMatch('ByeWorld');
        });

      await renameTemplateAppNameAsync({ cwd, files: ['app.json'], name: 'ByeWorld' });

      expect(spyReadFile).toHaveBeenCalledTimes(1);
      expect(spyWriteFile).toHaveBeenCalledTimes(1);
    });

    it('avoids writing if the replaced contents would be identical anyway', async () => {
      const spyReadFile = jest
        .spyOn(fs.promises, 'readFile')
        .mockImplementation(async (_filePath, _encoding) => 'HelloWorld');

      // No need to mock fs.writeFile this time, as we'll be asserting that it
      // wasn't called in the first place.
      const spyWriteFile = jest.spyOn(fs.promises, 'writeFile');

      await renameTemplateAppNameAsync({ cwd, files: ['app.json'], name: 'HelloWorld' });

      expect(spyReadFile).toHaveBeenCalledTimes(1);
      expect(spyWriteFile).toHaveBeenCalledTimes(0);
    });

    it('sanitizes generally unsafe characters when renaming', async () => {
      const spyReadFile = jest
        .spyOn(fs.promises, 'readFile')
        .mockImplementation(async (_filePath, _encoding) => 'HelloWorld');

      const spyWriteFile = jest
        .spyOn(fs.promises, 'writeFile')
        .mockImplementation(async (filePath, data) => {
          expect(path.basename(filePath as string)).toBe('app.json');
          expect(data).toMatch('ByeWorld');
        });

      await renameTemplateAppNameAsync({ cwd, files: ['app.json'], name: 'Bye!World' });

      expect(spyReadFile).toHaveBeenCalledTimes(1);
      expect(spyWriteFile).toHaveBeenCalledTimes(1);
    });

    it('derives the lowercase identifier from the sanitized name, matching path renames', async () => {
      // Lowercasing happens after sanitizing ('Ǉubljana' -> 'LJubljana' ->
      // 'ljubljana'), like in file-path renames.
      jest.spyOn(fs.promises, 'readFile').mockImplementation(async () => 'package com.helloworld;');
      let written = '';
      jest.spyOn(fs.promises, 'writeFile').mockImplementation(async (_filePath, data) => {
        written = data as string;
      });

      await renameTemplateAppNameAsync({ cwd, files: ['Main.kt'], name: 'Ǉubljana' });
      expect(written).toBe('package com.ljubljana;');
    });

    it.each([
      // XML-unsafe characters use entities in generic XML/plist files; Android
      // resource files (.xml) use backslash escapes for quotes
      ['A & B & C', 'strings.xml', '<string>A &amp; B &amp; C</string>'],
      ["Bob's App", 'strings.xml', "<string>Bob\\'s App</string>"],
      ['A "B" C', 'strings.xml', '<string>A \\"B\\" C</string>'],
      ['@string/foo', 'strings.xml', '<string>\\@string/foo</string>'],
      ['?attr', 'strings.xml', '<string>\\?attr</string>'],
      ['C:\\Temp', 'strings.xml', '<string>C:\\\\Temp</string>'],
      [' Padded ', 'strings.xml', '<string>" Padded "</string>'],
      ["Bob's App", 'app.plist', '<string>Bob&apos;s App</string>'],
      ['A "B" C', 'app.plist', '<string>A &quot;B&quot; C</string>'],
      // replacement patterns in the name are inserted literally, not expanded
      ['Cost $& Fees', 'app.json', '<string>Cost $& Fees</string>'],
    ])('renders the display name %j in %s as %j', async (name, file, expected) => {
      jest
        .spyOn(fs.promises, 'readFile')
        .mockImplementation(async () => '<string>Hello App Display Name</string>');
      let written = '';
      jest.spyOn(fs.promises, 'writeFile').mockImplementation(async (_filePath, data) => {
        written = data as string;
      });

      await renameTemplateAppNameAsync({ cwd, files: [file], name });
      expect(written).toBe(expected);
    });

    // XML escaping applies only to the display name; the sanitized project
    // identifiers derive from the raw name so they match across all files.
    it('derives the same sanitized identifier in XML and non-XML files', async () => {
      // There is probably a more Jesty way to spy this, but I am tired
      const filesRead: string[] = [];
      const filesWritten: string[] = [];

      const spyReadFile = jest
        .spyOn(fs.promises, 'readFile')
        .mockImplementation(async (filePath, _encoding) => {
          filesRead.push(filePath as string);
          return 'HelloWorld';
        });

      const spyWriteFile = jest
        .spyOn(fs.promises, 'writeFile')
        .mockImplementation(async (filePath, data) => {
          // Sanitization: Bye<World -> ByeWorld
          expect(data).toMatch('ByeWorld');

          filesWritten.push(filePath as string);
        });

      const files = ['app.json', 'app.plist', 'app.xml'];
      await renameTemplateAppNameAsync({ cwd, files, name: 'Bye<World' });

      expect(spyReadFile).toHaveBeenCalledTimes(3);
      expect(spyWriteFile).toHaveBeenCalledTimes(3);
      expect(filesRead).toEqual(files.map((file) => path.resolve(cwd, file)));
      expect(filesWritten).toEqual(files.map((file) => path.resolve(cwd, file)));
    });
  });
});
