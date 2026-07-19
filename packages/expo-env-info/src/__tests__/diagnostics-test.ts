import { vol } from 'memfs';

import { isBareWorkflowProject, isInsideProjectAsync } from '../diagnosticsAsync';

jest.mock('fs');

describe(isBareWorkflowProject, () => {
  const projectRoot = '/';

  afterEach(() => {
    vol.reset();
  });

  it('returns true for bare workflow projects that have an ios folder', async () => {
    vol.fromJSON(
      {
        '/mytest/app.json': '1',
        '/mytest/ios/myproject.xcodeproj': '2',
      },
      projectRoot
    );
    expect(await isBareWorkflowProject('/mytest')).toBeTruthy();
  });

  it('returns true for bare workflow projects that have an android folder', async () => {
    vol.fromJSON(
      {
        '/mytest/app.json': '1',
        '/mytest/android/build.gradle': '2',
      },
      projectRoot
    );
    expect(await isBareWorkflowProject('/mytest')).toBeTruthy();
  });

  it('returns false for non-bare workflow projects', async () => {
    vol.fromJSON(
      {
        '/mytest/app.json': '1',
      },
      projectRoot
    );
    expect(await isBareWorkflowProject('/mytest')).toBeFalsy();
  });
});

describe(isInsideProjectAsync, () => {
  const projectRoot = '/';

  afterEach(() => {
    vol.reset();
  });

  it('returns true if package.json is in the current folder', async () => {
    vol.fromJSON(
      {
        '/package.json': '1',
      },
      projectRoot
    );
    expect(await isInsideProjectAsync(projectRoot)).toBeTruthy();
  });

  it('returns false if package.json is not in the current folder', async () => {
    vol.fromJSON({}, projectRoot);
    expect(await isInsideProjectAsync(projectRoot)).toBeFalsy();
  });
});
