import { vol } from 'memfs';
import path from 'path';

import { findApplicationTargetWithDependenciesAsync, TargetType } from '../Target';

jest.mock('fs');

const originalFs = jest.requireActual('fs');

describe(findApplicationTargetWithDependenciesAsync, () => {
  const projectRoot = '/app';

  afterEach(() => vol.reset());

  it('reads the application target and its dependencies', async () => {
    vol.fromJSON(
      {
        'ios/testproject.xcodeproj/project.pbxproj': originalFs.readFileSync(
          path.join(__dirname, 'fixtures/project-multitarget.pbxproj'),
          'utf-8'
        ),
        'ios/testproject.xcodeproj/xcshareddata/xcschemes/multitarget.xcscheme': originalFs.readFileSync(
          path.join(__dirname, 'fixtures/multitarget.xcscheme'),
          'utf-8'
        ),
      },
      projectRoot
    );

    const applicationTarget = await findApplicationTargetWithDependenciesAsync(
      projectRoot,
      'multitarget'
    );
    expect(applicationTarget.name).toBe('multitarget');
    expect(applicationTarget.type).toBe(TargetType.APPLICATION);
    expect(applicationTarget.dependencies.length).toBe(1);
    expect(applicationTarget.dependencies[0].name).toBe('shareextension');
    expect(applicationTarget.dependencies[0].type).toBe(TargetType.EXTENSION);
  });

  it('also reads dependency dependencies', async () => {
    vol.fromJSON(
      {
        'ios/easwatchtest.xcodeproj/project.pbxproj': originalFs.readFileSync(
          path.join(__dirname, 'fixtures/watch.pbxproj'),
          'utf-8'
        ),
        'ios/easwatchtest.xcodeproj/xcshareddata/xcschemes/easwatchtest.xcscheme': originalFs.readFileSync(
          path.join(__dirname, 'fixtures/watch.xcscheme'),
          'utf-8'
        ),
      },
      projectRoot
    );

    const applicationTarget = await findApplicationTargetWithDependenciesAsync(
      projectRoot,
      'easwatchtest'
    );
    expect(applicationTarget.name).toBe('easwatchtest');
    expect(applicationTarget.type).toBe(TargetType.APPLICATION);
    expect(applicationTarget.dependencies.length).toBe(1);
    expect(applicationTarget.dependencies[0].name).toBe('eas-watch-test');
    expect(applicationTarget.dependencies[0].type).toBe(TargetType.OTHER);
    expect(applicationTarget.dependencies[0].dependencies[0].name).toBe(
      'eas-watch-test WatchKit Extension'
    );
    expect(applicationTarget.dependencies[0].dependencies[0].type).toBe(TargetType.OTHER);
  });
});
