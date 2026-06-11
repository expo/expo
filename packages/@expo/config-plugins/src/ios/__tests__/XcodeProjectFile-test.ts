import { vol } from 'memfs';
import * as path from 'path';

import rnFixture from '../../plugins/__tests__/fixtures/react-native-project';
import { createBuildSourceFile } from '../XcodeProjectFile';
import { getPbxproj } from '../utils/Xcodeproj';

jest.mock('fs');

describe(createBuildSourceFile, () => {
  const projectRoot = '/alpha';
  beforeAll(async () => {
    vol.fromJSON(rnFixture, projectRoot);
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
      filePath: 'HelloWorld/myfile.swift',
      fileContents: '// hello',
    });

    // The shim stores file-reference fields unquoted (the new serializer
    // applies any needed wrap at write time); the legacy library kept them
    // verbatim with surrounding quotes.
    expect(project.hasFile('HelloWorld/myfile.swift')).toMatchObject({
      fileEncoding: 4,
      includeInIndex: 0,
      isa: 'PBXFileReference',
      lastKnownFileType: 'sourcecode.swift',
      name: 'myfile.swift',
      path: 'HelloWorld/myfile.swift',
      sourceTree: '<group>',
    });

    expect(vol.existsSync(path.join(projectRoot, 'ios/HelloWorld/myfile.swift'))).toBe(true);
  });
});
