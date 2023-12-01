import spawnAsync from '@expo/spawn-async';
import editors from 'env-editor';

import { guessEditor, openInEditorAsync } from '../editor';

jest.mock('../../log');

const original_EXPO_EDITOR = process.env.EXPO_EDITOR;

afterAll(() => {
  process.env.EXPO_EDITOR = original_EXPO_EDITOR;
});

describe(guessEditor, () => {
  beforeEach(() => {
    delete process.env.EXPO_EDITOR;
  });

  it(`uses EXPO_EDITOR as the highest priority setting if defined`, () => {
    process.env.EXPO_EDITOR = 'bacon';
    guessEditor();

    expect(editors.getEditor).toBeCalledWith('bacon');
  });

  it(`defaults to vscode if the default editor cannot be guessed`, () => {
    jest.mocked(editors.defaultEditor).mockImplementationOnce(() => {
      throw new Error('Could not guess default editor');
    });
    guessEditor();
    expect(editors.getEditor).toBeCalledWith('vscode');
  });
});

describe(openInEditorAsync, () => {
  it(`fails to open in a given editor that does not exist`, async () => {
    jest.mocked(editors.defaultEditor).mockReturnValueOnce({
      name: 'my-editor',
      binary: 'my-editor-binary',
      id: 'my-editor-id',
    } as any);
    jest.mocked(spawnAsync).mockImplementationOnce(() => {
      throw new Error('failed');
    });

    await expect(openInEditorAsync('/foo/bar')).resolves.toBe(false);

    expect(spawnAsync).toBeCalledWith('my-editor-binary', ['/foo/bar']);
    expect(spawnAsync).toBeCalledTimes(1);
  });
});
