import spawnAsync from '@expo/spawn-async';
import path from 'node:path';
import process from 'node:process';

import { env } from './env';
import * as Log from '../log';

const debug = require('debug')('expo:utils:editor') as typeof console.log;

type Editor = (typeof EDITORS)[number];

function getEditor(input: string | undefined): Editor | null {
  if (!input) {
    return null;
  }
  const needle = input.trim().toLowerCase();
  const binary = needle.split(/[/\\]/).pop()?.replace(/\s/g, '-')?.split('-')[0];
  const editor =
    EDITORS.find((editor) => {
      switch (needle) {
        case editor.id:
        case editor.name.toLowerCase():
        case editor.binary:
          return true;
        default:
          for (const editorPath of editor.paths) {
            if (path.normalize(needle) === path.normalize(editorPath.toLowerCase())) return true;
          }
          for (const keyword of editor.keywords) {
            if (needle === keyword) return true;
          }
          return false;
      }
    }) ?? (binary ? EDITORS.find((editor) => editor.binary === binary) : null);
  return editor || null;
}

/** Guess what the default editor is and default to VSCode. */
export function guessEditor(): Editor | null {
  let editor: Editor | null = null;
  if (env.EXPO_EDITOR) {
    editor = getEditor(env.EXPO_EDITOR);
    if (editor) {
      debug('Using $EXPO_EDITOR:', editor.name);
    }
  }

  if (!editor && process.env.VISUAL) {
    editor = getEditor(process.env.VISUAL);
    if (editor) {
      debug('Using $VISUAL:', editor.name);
    }
  }

  if (!editor && process.env.EDITOR) {
    editor = getEditor(process.env.EDITOR);
    if (editor) {
      debug('Using $EDITOR:', editor.name);
    }
  }

  if (editor) {
    return editor;
  } else {
    debug('Falling back on vscode');
    return getEditor('vscode');
  }
}

/** Open a file path in a given editor. */
export async function openInEditorAsync(path: string, lineNumber?: number): Promise<boolean> {
  const editor = guessEditor();
  if (editor && !editor.isTerminalEditor) {
    const fileReference = lineNumber ? `${path}:${lineNumber}` : path;
    debug(
      `Opening ${fileReference} in ${editor?.name} (bin: ${editor?.binary}, id: ${editor?.id})`
    );

    if (editor) {
      try {
        await spawnAsync(editor.binary, getEditorArguments(editor, path, lineNumber), {
          timeout: 1_000,
        });
        return true;
      } catch (error: any) {
        debug(
          `Failed to open ${fileReference} in editor (path: ${path}, binary: ${editor.binary}):`,
          error
        );
      }
    }
  }

  Log.error(
    (editor?.isTerminalEditor
      ? `Could not open ${editor.name} as it's a terminal editor.`
      : 'Could not open editor.') +
      `\nYou can set an editor for Expo to open automatically by defining the $EDITOR environment variable (e.g. "vscode" or "atom")`
  );
  return false;
}

function getEditorArguments(editor: Editor, path: string, lineNumber?: number): string[] {
  if (!lineNumber) {
    return [path];
  }

  switch (editor.id) {
    case 'atom':
    case 'sublime':
      return [`${path}:${lineNumber}`];

    case 'emacs':
    case 'emacsforosx':
    case 'nano':
    case 'neovim':
    case 'vim':
      return [`+${lineNumber}`, path];

    case 'android-studio':
    case 'intellij':
    case 'textmate':
    case 'webstorm':
    case 'xcode':
      return [`--line=${lineNumber}`, path];

    case 'vscode':
    case 'vscodium':
      return ['-g', `${path}:${lineNumber}`];

    default:
      return [path];
  }
}

const EDITORS = [
  {
    id: 'sublime',
    name: 'Sublime Text',
    binary: 'subl',
    isTerminalEditor: false,
    paths: [
      '/Applications/Sublime Text.app/Contents/SharedSupport/bin/subl',
      '/Applications/Sublime Text 2.app/Contents/SharedSupport/bin/subl',
    ],
    keywords: [],
  },
  {
    id: 'atom',
    name: 'Atom',
    binary: 'atom',
    isTerminalEditor: false,
    paths: ['/Applications/Atom.app/Contents/Resources/app/atom.sh'],
    keywords: [],
  },
  {
    id: 'vscode-insiders',
    name: 'Visual Studio Code - Insiders',
    binary: 'code-insiders',
    isTerminalEditor: false,
    paths: [
      '/Applications/Visual Studio Code - Insiders.app/Contents/Resources/app/bin/code-insiders',
    ],
    keywords: ['vs code insiders', 'code insiders', 'insiders'],
  },
  {
    id: 'vscode',
    name: 'Visual Studio Code',
    binary: 'code',
    isTerminalEditor: false,
    paths: ['/Applications/Visual Studio Code.app/Contents/Resources/app/bin/code'],
    keywords: ['vs code'],
  },
  {
    id: 'vscodium',
    name: 'VSCodium',
    binary: 'codium',
    isTerminalEditor: false,
    paths: ['/Applications/VSCodium.app/Contents/Resources/app/bin/codium'],
    keywords: [],
  },
  {
    id: 'webstorm',
    name: 'WebStorm',
    binary: 'webstorm',
    isTerminalEditor: false,
    paths: [],
    keywords: ['wstorm'],
  },
  {
    id: 'phpstorm',
    name: 'PhpStorm',
    binary: 'pstorm',
    isTerminalEditor: false,
    paths: [],
    keywords: ['php'],
  },
  {
    id: 'textmate',
    name: 'TextMate',
    binary: 'mate',
    isTerminalEditor: false,
    paths: [],
    keywords: [],
  },
  {
    id: 'vim',
    name: 'Vim',
    binary: 'vim',
    isTerminalEditor: true,
    paths: [],
    keywords: ['vi'],
  },
  {
    id: 'neovim',
    name: 'NeoVim',
    binary: 'nvim',
    isTerminalEditor: true,
    paths: [],
    keywords: ['vim'],
  },
  {
    id: 'intellij',
    name: 'IntelliJ IDEA',
    binary: 'idea',
    isTerminalEditor: false,
    paths: [],
    keywords: ['idea', 'java', 'jetbrains', 'ide'],
  },
  {
    id: 'nano',
    name: 'GNU nano',
    binary: 'nano',
    isTerminalEditor: true,
    paths: [],
    keywords: [],
  },
  {
    id: 'emacs',
    name: 'GNU Emacs',
    binary: 'emacs',
    isTerminalEditor: true,
    paths: [],
    keywords: [],
  },
  {
    id: 'emacsforosx',
    name: 'GNU Emacs for Mac OS X',
    binary: 'Emacs',
    isTerminalEditor: false,
    paths: ['/Applications/Emacs.app/Contents/MacOS/Emacs'],
    keywords: [],
  },
  {
    id: 'android-studio',
    name: 'Android Studio',
    binary: 'studio',
    isTerminalEditor: false,
    paths: [
      '/Applications/Android Studio.app/Contents/MacOS/studio',
      '/usr/local/Android/android-studio/bin/studio.sh',
      'C:\\Program Files (x86)\\Android\\android-studio\\bin\\studio.exe',
      'C:\\Program Files\\Android\\android-studio\\bin\\studio64.exe',
    ],
    keywords: ['studio'],
  },
  {
    id: 'xcode',
    name: 'Xcode',
    binary: 'xed',
    isTerminalEditor: false,
    paths: [
      '/Applications/Xcode.app/Contents/MacOS/Xcode',
      '/Applications/Xcode-beta.app/Contents/MacOS/Xcode',
    ],
    keywords: ['xed'],
  },
];
