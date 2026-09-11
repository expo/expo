import { vol } from 'memfs';
import path from 'path';

import { getNativeTargets } from '../../Target';
import { getPbxproj, readXcodeProject } from '../Xcodeproj';

jest.mock('fs');

const originalFs = jest.requireActual<typeof import('fs')>('fs');
const projectRoot = '/project';
const nativeTargetId = '13B07F861A680F5B00A75B9A';

afterEach(() => vol.reset());

it('reads the requested project when another project contains the same target identifier', () => {
  const selectedProjectPath = '/project/ios/Watch.xcodeproj/project.pbxproj';
  vol.fromJSON({
    '/project/ios/App.xcodeproj/project.pbxproj': originalFs.readFileSync(
      path.join(__dirname, '../../__tests__/fixtures/project-multitarget.pbxproj'),
      'utf8'
    ),
    [selectedProjectPath]: originalFs.readFileSync(
      path.join(__dirname, '../../__tests__/fixtures/watch.pbxproj'),
      'utf8'
    ),
  });

  const project = readXcodeProject(selectedProjectPath);

  expect(project.filepath).toBe(selectedProjectPath);
  expect(getNativeTargets(project).find(([id]) => id === nativeTargetId)?.[1].name).toBe(
    'easwatchtest'
  );
});

it('continues discovering the project from the project root', () => {
  const projectPath = '/project/ios/App.xcodeproj/project.pbxproj';
  vol.fromJSON({
    [projectPath]: originalFs.readFileSync(
      path.join(__dirname, '../../__tests__/fixtures/project-multitarget.pbxproj'),
      'utf8'
    ),
  });

  const project = getPbxproj(projectRoot);

  expect(project.filepath).toBe(projectPath);
  expect(getNativeTargets(project).find(([id]) => id === nativeTargetId)?.[1].name).toBe(
    'multitarget'
  );
});
