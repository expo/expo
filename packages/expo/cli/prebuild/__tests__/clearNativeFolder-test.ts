import { vol } from 'memfs';

import { getMalformedNativeProjectsAsync } from '../clearNativeFolder';
import rnFixture from './fixtures/react-native-project';

jest.mock('fs');
jest.mock('resolve-from');

describe(getMalformedNativeProjectsAsync, () => {
  afterEach(() => {
    vol.reset();
  });

  it(`gets fully qualified list of native projects to clear`, async () => {
    const projectRoot = '/';
    vol.fromJSON(rnFixture, projectRoot);
    const malformed = await getMalformedNativeProjectsAsync(projectRoot, ['android', 'ios']);
    expect(malformed).toStrictEqual([]);
  });

  it(`skips platforms that are missing native project folders`, async () => {
    const projectRoot = '/';
    vol.fromJSON(
      {
        ...Object.entries(rnFixture).reduce((prev, [key, value]) => {
          // Skip ios project files
          if (key.startsWith('ios')) return prev;
          return {
            ...prev,
            [key]: value,
          };
        }, {}),
      },
      projectRoot
    );
    const malformed = await getMalformedNativeProjectsAsync(projectRoot, ['android', 'ios']);
    expect(malformed).toStrictEqual([]);
  });

  it(`finds a single platform`, async () => {
    const projectRoot = '/';
    vol.fromJSON(rnFixture, projectRoot);
    const malformed = await getMalformedNativeProjectsAsync(projectRoot, ['ios']);
    expect(malformed).toStrictEqual([]);
  });

  it(`finds malformed projects`, async () => {
    const projectRoot = '/';
    vol.fromJSON(
      {
        ...Object.entries(rnFixture).reduce((prev, [key, value]) => {
          // Skip core files to emulate a malformed project
          if (
            [
              'ios/ReactNativeProject/Info.plist',
              'android/app/src/main/java/com/reactnativeproject/MainApplication.java',
            ].includes(key)
          ) {
            return prev;
          }
          return {
            ...prev,
            [key]: value,
          };
        }, {}),
      },
      projectRoot
    );
    const malformed = await getMalformedNativeProjectsAsync(projectRoot, ['ios', 'android']);
    expect(malformed).toStrictEqual(['ios', 'android']);
  });

  // Most closely emulates the core use-case.
  it(`finds malformed projects with empty folders`, async () => {
    const projectRoot = '/';
    vol.fromJSON(
      {
        'ios/foo': undefined,
        'android/foo': undefined,
      },
      projectRoot
    );
    const malformed = await getMalformedNativeProjectsAsync(projectRoot, ['ios', 'android']);
    expect(malformed).toStrictEqual(['ios', 'android']);
  });

  it(`finds neither platform when no native projects exist`, async () => {
    const projectRoot = '/';
    vol.fromJSON({}, projectRoot);
    const malformed = await getMalformedNativeProjectsAsync(projectRoot, ['ios', 'android']);
    expect(malformed).toStrictEqual([]);
  });
});
