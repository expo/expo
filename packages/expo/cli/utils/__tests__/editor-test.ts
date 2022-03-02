import spawnAsync from '@expo/spawn-async';
import editors from 'env-editor';

import { guessEditor, openInEditorAsync } from '../editor';

const asMock = <T extends (...args: any[]) => any>(fn: T): jest.MockedFunction<T> =>
  fn as jest.MockedFunction<T>;

jest.mock('../../log');
jest.mock('@expo/spawn-async', () => ({
  __esModule: true,
  default: jest.fn(),
}));
jest.mock('env-editor', () => ({
  __esModule: true,
  default: {
    defaultEditor: jest.fn(),
    getEditor: jest.fn(),
  },
}));

describe(guessEditor, () => {
  it(`defaults to vscode if the default editor cannot be guessed`, () => {
    asMock(editors.defaultEditor)
      .mockClear()
      .mockImplementationOnce(() => {
        throw new Error('Could not guess default editor');
      });
    guessEditor();
    expect(editors.getEditor).toBeCalledWith('vscode');
  });
});

describe(openInEditorAsync, () => {
  it(`failed to open in given editor that doesn't exist`, async () => {
    asMock(editors.defaultEditor)
      .mockClear()
      .mockReturnValueOnce({
        name: 'my-editor',
        binary: 'my-editor-binary',
        id: 'my-editor-id',
      } as any);
    asMock(spawnAsync)
      .mockClear()
      .mockImplementationOnce(() => {
        throw new Error('failed');
      });

    await expect(openInEditorAsync('/foo/bar', 'my-editor')).resolves.toBe(false);

    expect(spawnAsync).toBeCalledWith('my-editor-binary', ['/foo/bar']);
    expect(spawnAsync).toBeCalledTimes(1);
  });
});
