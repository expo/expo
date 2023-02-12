import * as fs from 'fs';
import { vol } from 'memfs';
import * as path from 'path';

import { createBuildSourceFile } from '../XcodeProjectFile';
import { getPbxproj } from '../utils/Xcodeproj';

const fsReal = jest.requireActual('fs') as typeof fs;

jest.mock('fs');

describe(createBuildSourceFile, () => {
  const projectRoot = '/alpha';
  beforeAll(async () => {
    vol.fromJSON(
      {
        'ios/testproject.xcodeproj/project.pbxproj': fsReal.readFileSync(
          path.join(__dirname, 'fixtures/project.pbxproj'),
          'utf-8'
        ),
        'ios/testproject/AppDelegate.m': '',
      },
      projectRoot
    );
  });

  afterAll(() => {
    vol.reset();
  });

  it(`creates a source file`, () => {
    const project = getPbxproj(projectRoot);
    // perform action
    createBuildSourceFile({
      project,
      nativeProjectRoot: path.join(projectRoot, 'ios'),
      filePath: 'testproject/myfile.swift',
      fileContents: '// hello',
    });

    expect(project.hasFile('testproject/myfile.swift')).toStrictEqual({
      explicitFileType: undefined,
      fileEncoding: 4,
      includeInIndex: 0,
      isa: 'PBXFileReference',
      lastKnownFileType: 'sourcecode.swift',
      name: '"myfile.swift"',
      path: '"testproject/myfile.swift"',
      sourceTree: '"<group>"',
    });

    expect(vol.existsSync(path.join(projectRoot, 'ios/testproject/myfile.swift'))).toBe(true);
  });
});
