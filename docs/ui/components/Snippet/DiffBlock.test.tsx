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
  expect(screen.getByText('ios/MyApp/AppDelegate.h')).toBeInTheDocument();
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

    await screen.findByText('ios/MyApp/AppDelegate.h');

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
});
