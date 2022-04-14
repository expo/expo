import spawnAsync from '@expo/spawn-async';
import editors from 'env-editor';

import { guessEditor, openInEditorAsync } from '../editor';

const asMock = <T extends (...args: any[]) => any>(fn: T): jest.MockedFunction<T> =>
  fn as jest.MockedFunction<T>;

jest.mock('../../log');

describe(guessEditor, () => {
  it(`defaults to vscode if the default editor cannot be guessed`, () => {
    asMock(editors.defaultEditor).mockImplementationOnce(() => {
      throw new Error('Could not guess default editor');
    });
    guessEditor();
    expect(editors.getEditor).toBeCalledWith('vscode');
  });
});

describe(openInEditorAsync, () => {
  it(`fails to open in a given editor that does not exist`, async () => {
    asMock(editors.defaultEditor).mockReturnValueOnce({
      name: 'my-editor',
      binary: 'my-editor-binary',
      id: 'my-editor-id',
    } as any);
    asMock(spawnAsync).mockImplementationOnce(() => {
      throw new Error('failed');
    });

    await expect(openInEditorAsync('/foo/bar')).resolves.toBe(false);

    expect(spawnAsync).toBeCalledWith('my-editor-binary', ['/foo/bar']);
    expect(spawnAsync).toBeCalledTimes(1);
  });
});
