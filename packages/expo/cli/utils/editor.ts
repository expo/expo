import spawnAsync from '@expo/spawn-async';
import editors from 'env-editor';

import * as Log from '../log';

/** Guess what the default editor is and default to VSCode. */
export function guessEditor(): editors.Editor {
  try {
    return editors.defaultEditor();
  } catch {
    return editors.getEditor('vscode');
  }
}

/** Open a file path in a given editor. */
export async function openInEditorAsync(path: string): Promise<boolean> {
  const editor = guessEditor();

  Log.debug(`Opening ${path} in ${editor?.name} (bin: ${editor?.binary}, id: ${editor?.id})`);
  if (editor) {
    try {
      await spawnAsync(editor.binary, [path]);
      return true;
    } catch (error) {
      Log.debug(
        `Failed to auto open path in editor (path: ${path}, binary: ${editor.binary}):`,
        error
      );
    }
  }

  Log.error(
    'Could not open editor, you can set it by defining the $EDITOR environment variable with the binary of your editor. (e.g. "vscode" or "atom")'
  );
  return false;
}
