import spawnAsync from '@expo/spawn-async';
import editors from 'env-editor';

import { env } from './env';
import * as Log from '../log';

const debug = require('debug')('expo:utils:editor') as typeof console.log;

/** Guess what the default editor is and default to VSCode. */
export function guessEditor(): editors.Editor {
  try {
    const editor = env.EXPO_EDITOR;
    if (editor) {
      debug('Using $EXPO_EDITOR:', editor);
      return editors.getEditor(editor);
    }
    debug('Falling back on $EDITOR:', editor);
    return editors.defaultEditor();
  } catch {
    debug('Falling back on vscode');
    return editors.getEditor('vscode');
  }
}

/** Open a file path in a given editor. */
export async function openInEditorAsync(path: string): Promise<boolean> {
  const editor = guessEditor();

  debug(`Opening ${path} in ${editor?.name} (bin: ${editor?.binary}, id: ${editor?.id})`);
  if (editor) {
    try {
      await spawnAsync(editor.binary, [path]);
      return true;
    } catch (error: any) {
      debug(`Failed to auto open path in editor (path: ${path}, binary: ${editor.binary}):`, error);
    }
  }

  Log.error(
    'Could not open editor, you can set it by defining the $EDITOR environment variable with the binary of your editor. (e.g. "vscode" or "atom")'
  );
  return false;
}
