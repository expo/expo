import { jest } from '@jest/globals';
import { render, Screen, screen } from '@testing-library/react';
import fs from 'fs-extra';
import path from 'path';
import { fileURLToPath } from 'url';

import { DiffBlock } from '.';

const dirname = path.dirname(fileURLToPath(import.meta.url));

const DIFF_PATH = '/static/diffs/expo-updates-js.diff';
const DIFF_CONTENT = fs.readFileSync(path.join(dirname, '../../../public', DIFF_PATH)).toString();

const validateDiffContent = (screen: Screen) => {
  expect(screen.getByText('app.json')).toBeInTheDocument();
  expect(screen.getByText('index.js')).toBeInTheDocument();
  expect(screen.getByText('metro.config.js')).toBeInTheDocument();

  expect(screen.getByText('"slug": "my-app",')).toBeInTheDocument();
  expect(screen.getByText("import 'expo-asset';")).toBeInTheDocument();
  expect(
    screen.getByText("assetPlugins: ['expo-asset/tools/hashAssetFiles'],")
  ).toBeInTheDocument();
};

describe(DiffBlock, () => {
  it('renders diff from file correctly', async () => {
    global.fetch = jest.fn(() =>
      Promise.resolve({
        text: async () => DIFF_CONTENT,
      } as Response)
    );

    render(<DiffBlock source={DIFF_PATH} />);

    await screen.findByText('app.json');

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
