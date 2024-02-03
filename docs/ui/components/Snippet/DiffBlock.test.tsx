import { jest } from '@jest/globals';
import { render, Screen, screen } from '@testing-library/react';
import fs from 'fs-extra';
import path from 'path';
import { fileURLToPath } from 'url';

import { DiffBlock } from '.';

const dirname = path.dirname(fileURLToPath(import.meta.url));

const DIFF_PATH = '/static/diffs/expo-ios.diff';
const DIFF_CONTENT = fs.readFileSync(path.join(dirname, '../../../public', DIFF_PATH)).toString();

const validateDiffContent = (screen: Screen) => {
  expect(screen.getByText('ios/myapp/AppDelegate.h')).toBeInTheDocument();
  expect(screen.getByText('ios/Podfile')).toBeInTheDocument();
  expect(screen.getByText('#import <UIKit/UIKit.h>')).toBeInTheDocument();
  expect(screen.getByText('#import <Expo/Expo.h>')).toBeInTheDocument();
};

describe(DiffBlock, () => {
  it('renders diff from file correctly', async () => {
    global.fetch = jest.fn(() =>
      Promise.resolve({
        text: async () => DIFF_CONTENT,
      } as Response)
    );

    render(<DiffBlock source={DIFF_PATH} />);

    await screen.findByText('ios/myapp/AppDelegate.h');

    validateDiffContent(screen);
  });

  it('renders raw diff correctly on first render', () => {
    render(<DiffBlock raw={DIFF_CONTENT} />);

    validateDiffContent(screen);
  });

  it('renders diff correctly when no commit data', () => {
    const noCommitDataDiff = DIFF_CONTENT.replaceAll(/\s+index.+/g, '');

    expect(noCommitDataDiff.includes('index ')).toBe(false);

    render(<DiffBlock raw={noCommitDataDiff} />);

    validateDiffContent(screen);
  });

  it('Shows the operation in header when showOperation is true', () => {
    render(<DiffBlock raw={DIFF_CONTENT} showOperation />);

    expect(screen.getAllByText('MODIFIED')).toBeTruthy();
  });

  it('Collapses deleted files when collapseDeletedFiles is true', () => {
    const diffWithDelete = `
diff --git a/templates/expo-template-bare-minimum/__tests__/App.js b/templates/expo-template-bare-minimum/__tests__/App.js
deleted file mode 100644
index fa45c70206..0000000000
--- a/templates/expo-template-bare-minimum/__tests__/App.js
+++ /dev/null
@@ -1,10 +0,0 @@
-import 'react-native';
-import React from 'react';
-import App from '../App';
-
-// Note: test renderer must be required after react-native.
-import renderer from 'react-test-renderer';
-
-it('renders correctly', () => {
-  renderer.create(<App />);
-});`;
    render(<DiffBlock raw={diffWithDelete} collapseDeletedFiles />);

    expect(screen.queryByText(`import 'react-native';`)).not.toBeInTheDocument();
  });
});
