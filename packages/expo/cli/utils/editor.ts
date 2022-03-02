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
export async function openInEditorAsync(path: string, inputEditor?: string): Promise<boolean> {
  const editor = inputEditor ? editors.getEditor(inputEditor) : guessEditor();

  Log.debug(`Opening ${path} in ${editor?.name} (bin: ${editor?.binary}, id: ${editor?.id})`);
  if (editor) {
    try {
      await spawnAsync(editor.binary, [path]);
      return true;
    } catch (error) {
      Log.debug(
        `Failed to auto open path in editor (path: ${path}, binary: ${editor.binary}, preferred: ${inputEditor}):`,
        error
      );
    }
  }

  if (inputEditor) {
    Log.error(
      // TODO: Is this still in use?
      `Could not resolve editor from environment variable $EXPO_EDITOR="${inputEditor}". Trying again with system default.`
    );
    return openInEditorAsync(path);
  }

  Log.error(
    'Could not open editor, you can set it by defining the $EDITOR environment variable with the binary of your editor. (e.g. "code" or "atom")'
  );
  return false;
}
