import spawnAsync from '@expo/spawn-async';
import editors from 'env-editor';

import * as Log from '../log';

export function guessEditor() {
  try {
    return editors.defaultEditor();
  } catch {
    return editors.getEditor('vscode');
  }
}

export async function openInEditorAsync(path: string, inputEditor?: string): Promise<boolean> {
  const editor = inputEditor ? editors.getEditor(inputEditor) : guessEditor();

  Log.debug(`Opening ${path} in ${editor.name} (bin: ${editor.binary}, id: ${editor.id})`);
  if (editor) {
    try {
      await spawnAsync(editor.binary, [path]);
      return true;
    } catch {}
  }

  if (inputEditor) {
    Log.error(
      `Could not resolve editor from environment variable $EXPO_EDITOR="${inputEditor}". Trying again with system default.`
    );
    return openInEditorAsync(path);
  }

  Log.error(
    'Could not open editor, you can set it by defining the $EDITOR environment variable with the binary of your editor. (e.g. "code" or "atom")'
  );
  return false;
}
