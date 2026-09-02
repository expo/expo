import { jest } from '@jest/globals';
import { render, Screen, screen } from '@testing-library/react';
import fs from 'fs-extra';
import GithubSlugger from 'github-slugger';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { createHeadingManager } from '~/common/headingManager';
import { axe } from '~/common/test-utilities';
import { HeadingsContext } from '~/common/withHeadingManager';

import { DiffBlock } from '.';
import { PermalinkedSnippetHeader } from './PermalinkedSnippetHeader';

const dirname = path.dirname(fileURLToPath(import.meta.url));

const DIFF_PATH = '/static/diffs/expo-ios.diff';
const DIFF_CONTENT = fs.readFileSync(path.join(dirname, '../../../public', DIFF_PATH)).toString();

const validateDiffContent = (screen: Screen) => {
  expect(screen.getByText('ios/Podfile')).toBeInTheDocument();
};

describe(DiffBlock, () => {
  it('renders diff from file correctly', async () => {
    global.fetch = jest.fn(() =>
      Promise.resolve({
        text: async () => DIFF_CONTENT,
      } as Response)
    );

    render(<DiffBlock source={DIFF_PATH} />);

    await screen.findByText('ios/Podfile');

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

  it('keeps permalinked diff header actions outside of the permalink link', () => {
    const headingManager = createHeadingManager(new GithubSlugger(), { headings: [] });
    const singleFileDiff = `diff --git a/templates/expo-template-bare-minimum/android/app/src/main/AndroidManifest.xml b/templates/expo-template-bare-minimum/android/app/src/main/AndroidManifest.xml
index 43aaf83..3d5a6c7 100644
--- a/templates/expo-template-bare-minimum/android/app/src/main/AndroidManifest.xml
+++ b/templates/expo-template-bare-minimum/android/app/src/main/AndroidManifest.xml
@@ -1 +1 @@
-<manifest />
+<manifest xmlns:tools="http://schemas.android.com/tools" />`;

    render(
      <HeadingsContext.Provider value={headingManager}>
        <DiffBlock
          raw={singleFileDiff}
          filenameModifier={str => str.replace('templates/expo-template-bare-minimum/', '')}
          filenameToLinkUrl={filename => `https://github.com/expo/expo/tree/sdk-55/${filename}`}
          SnippetHeaderComponent={PermalinkedSnippetHeader}
        />
      </HeadingsContext.Provider>
    );

    expect(
      screen.getByRole('link', { name: 'android/app/src/main/AndroidManifest.xml' })
    ).toHaveAttribute('href', '#androidappsrcmainandroidmanifestxml');
    expect(screen.queryByRole('link', { name: /Raw/ })).not.toBeInTheDocument();
    expect(screen.queryByRole('link', { name: /Show settings/ })).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Raw' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Show settings' })).toBeInTheDocument();
  });

  it('has no axe violations', async () => {
    const { container } = render(<DiffBlock raw={DIFF_CONTENT} />);
    expect(await axe(container)).toHaveNoViolations();
  });
});
