import spawnAsync from '@expo/spawn-async';
import { vol } from 'memfs';

import { guessEditor, openInEditorAsync, guessFallbackVisualEditor } from '../editor';

jest.mock('../../log');

beforeEach(() => {
  vol.reset();
  process.env.EXPO_EDITOR = undefined;
  process.env.VISUAL = undefined;
  process.env.EDITOR = undefined;
});

describe('guessEditor', () => {
  it(`uses EXPO_EDITOR as the highest priority setting if defined`, () => {
    process.env.EXPO_EDITOR = 'atom';
    expect(guessEditor()).toMatchObject({
      id: 'atom',
    });
  });

  it(`uses VISUAL as the next-highest priority setting if defined`, () => {
    process.env.EXPO_EDITOR = undefined;
    process.env.VISUAL = 'atom';
    expect(guessEditor()).toMatchObject({
      id: 'atom',
    });
  });

  it(`uses EDITOR as the lowest priority setting if defined`, () => {
    process.env.EXPO_EDITOR = undefined;
    process.env.VISUAL = undefined;
    process.env.EDITOR = 'atom';
    expect(guessEditor()).toMatchObject({
      id: 'atom',
    });
  });

  it(`returns null if no editor is applied`, () => {
    process.env.EXPO_EDITOR = undefined;
    process.env.VISUAL = undefined;
    process.env.EDITOR = undefined;
    expect(guessEditor()).toBe(null);
  });

  it(`returns null if editor is unknown`, () => {
    process.env.EXPO_EDITOR = 'any';
    expect(guessEditor()).toBe(null);
  });
});

describe('guessFallbackVisualEditor', () => {
  it(`tries to find a visual editor in PATH`, async () => {
    vol.fromJSON(
      {
        '/bin/code': '',
      },
      '/'
    );
    process.env.PATH = '/bin';
    expect(await guessFallbackVisualEditor()).toMatchObject({
      id: 'vscode',
    });
  });

  it(`otherwise returns null`, async () => {
    process.env.PATH = '/bin';
    expect(await guessFallbackVisualEditor()).toBe(null);
  });
});

describe(openInEditorAsync, () => {
  it(`spawns the determined editor`, async () => {
    process.env.EDITOR = 'code';

    jest.mocked(spawnAsync).mockImplementationOnce(() => {
      throw new Error('failed');
    });

    await expect(openInEditorAsync('file')).resolves.toBe(false);

    expect(spawnAsync).toHaveBeenCalledWith(
      'code',
      ['-g', 'file'],
      expect.objectContaining({ timeout: 1000 })
    );
    expect(spawnAsync).toHaveBeenCalledTimes(1);
  });
});
