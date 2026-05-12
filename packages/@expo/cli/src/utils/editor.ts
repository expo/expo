import spawnAsync from '@expo/spawn-async';
import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';

import { env } from './env';
import * as Log from '../log';

const debug = require('debug')('expo:utils:editor') as typeof console.log;

interface Editor {
  id: string;
  name: string;
  binary: string;
  isTerminalEditor: boolean;
  isOSXOnly?: boolean;
  paths: string[];
  keywords: string[];
}

// See: https://github.com/sindresorhus/env-editor/blob/3f6aea10ff53910c877b1bf73a8e0c954a5fbf11/index.js
// MIT License, Copyright (c) Sindre Sorhus <sindresorhus@gmail.com> (https://sindresorhus.com)
function getEditor(input: string | undefined, allowAnyEditor = false): Editor | null {
  const needle = input?.trim().toLowerCase();
  if (!needle) {
    return null;
  }
  const id = needle.split(/[/\\]/).pop()?.replace(/\s/g, '-');
  const binary = id?.split('-')[0];
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
  if (allowAnyEditor && id && binary && !editor) {
    return {
      id,
      name: needle,
      binary,
      isTerminalEditor: false,
      paths: [],
      keywords: [],
    };
  }
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

  return editor;
}

export async function guessFallbackVisualEditor(): Promise<Editor | null> {
  // We search for editors at known `editor.paths`
  for (const editor of VISUAL_EDITORS) {
    const target = await editorExistsAtPaths(editor);
    if (target) {
      debug('Found visual editor fallback:', editor.name);
      return { ...editor, binary: target };
    }
  }
  // We search again for a visual editor against `editor.binary` in `$PATH`
  for (const editor of VISUAL_EDITORS) {
    const target = await editorExistsInPath(editor);
    if (target) {
      debug('Found visual editor fallback in $PATH:', editor.name);
      return { ...editor, binary: target };
    }
  }
  return null;
}

let _cachedEditor: Editor | null | undefined;

async function determineEditorAsync(): Promise<Editor | null> {
  if (_cachedEditor !== undefined) {
    return _cachedEditor;
  }

  // First: Try to get a known editor
  let editor = guessEditor();

  // Second: If we don't have a known editor, fall back to EXPO_EDITOR / VISUAL resolution
  // We check if the binary in these environment variables exists in the $PATH
  const forceEditorName = env.EXPO_EDITOR ?? process.env.VISUAL;
  if (!editor && forceEditorName) {
    const forceEditor = getEditor(forceEditorName, true);
    if (forceEditor && (await editorExistsInPath(forceEditor))) {
      editor = forceEditor;
    }
  }

  // Third: Try to find a fallback visual editor, but keep the found one if we can't find a fallback
  if (editor?.isTerminalEditor) {
    const fallback = await guessFallbackVisualEditor();
    if (fallback) {
      editor = fallback;
    }
  }

  return (_cachedEditor = editor);
}

/** Open a file path in a given editor. */
export async function openInEditorAsync(path: string, lineNumber?: number): Promise<boolean> {
  const editor = await determineEditorAsync();

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
        // NOTE(@kitten): The process might explicitly request to be terminated, which is fine
        if (error?.signal === 'SIGTERM') {
          return true;
        }
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
      `\nYou can set an editor for Expo to open by defining the $EXPO_EDITOR or $VISUAL environment variable (e.g. "vscode" or "atom")`
  );
  return false;
}

function getEditorArguments(editor: Editor, path: string, lineNumber?: number): string[] {
  switch (editor.id) {
    case 'atom':
    case 'sublime':
      return lineNumber ? [`${path}:${lineNumber}`] : [path];

    case 'emacs':
    case 'emacsforosx':
    case 'nano':
    case 'neovim':
    case 'vim':
      return lineNumber ? [`+${lineNumber}`, path] : [path];

    case 'android-studio':
    case 'intellij':
    case 'textmate':
    case 'webstorm':
    case 'xcode':
      return lineNumber ? [`--line=${lineNumber}`, path] : [path];

    case 'vscode':
    case 'vscodium':
    case 'cursor':
      return lineNumber ? ['-g', `${path}:${lineNumber}`] : ['-g', path];

    case 'zed':
      // '-r': Stands for "--reuse" and ensures we don't use the `zed` GUI binary, since the Zed CLI
      // is linked as `zed` into `$PATH` when it's actually the CLI
      return lineNumber ? ['-r', `${path}:${lineNumber}`] : ['-r', path];

    default:
      return [path];
  }
}

/** Attempt to resolve an editor against $PATH */
async function editorExistsInPath(editor: Editor) {
  if (process.platform !== 'darwin' && editor.isOSXOnly) {
    return null;
  }
  const binary = editor.binary;
  const paths = (process.env.PATH || process.env.Path || '')
    .split(path.delimiter)
    .map((target) => target.trim())
    .filter((target) => !!target);
  const exts =
    process.platform === 'win32'
      ? (process.env.PATHEXT || '.EXE;.CMD;.BAT;.COM').split(path.delimiter).filter(Boolean)
      : [''];
  const targets = paths.flatMap((dir) => exts.map((ext) => path.join(dir, `${binary}${ext}`)));
  for (const target of targets) {
    try {
      const mode = process.platform === 'win32' ? fs.constants.F_OK : fs.constants.X_OK;
      await fs.promises.access(target, mode);
      return target;
    } catch {
      // ignore not found and continue
    }
  }
  return null;
}

/** Attempt to resolve an editor against known `paths` */
async function editorExistsAtPaths(editor: Editor) {
  // We can skip the path if it's not for our platform (win32 vs posix paths)
  const targets = editor.paths.filter((target) => target.includes(path.sep));
  for (const target of targets) {
    try {
      const mode = process.platform === 'win32' ? fs.constants.F_OK : fs.constants.X_OK;
      await fs.promises.access(target, mode);
      return target;
    } catch {
      // ignore not found and continue
    }
  }
  return null;
}

const TERMINAL_EDITORS: (Editor & { isTerminalEditor: true })[] = [
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
];

const VISUAL_EDITORS: (Editor & { isTerminalEditor: false })[] = [
  {
    id: 'vscode',
    name: 'Visual Studio Code',
    binary: 'code',
    isTerminalEditor: false,
    paths: ['/Applications/Visual Studio Code.app/Contents/Resources/app/bin/code'],
    keywords: ['vs code'],
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
    id: 'vscodium',
    name: 'VSCodium',
    binary: 'codium',
    isTerminalEditor: false,
    paths: ['/Applications/VSCodium.app/Contents/Resources/app/bin/codium'],
    keywords: [],
  },
  {
    id: 'cursor',
    name: 'Cursor',
    binary: 'cursor',
    isTerminalEditor: false,
    paths: ['/Applications/Cursor.app/Contents/Resources/app/bin/codium'],
    keywords: [],
  },
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
    id: 'zed',
    name: 'Zed',
    binary: 'zed',
    isTerminalEditor: false,
    paths: ['/Applications/Zed.app/Contents/MacOS/cli'],
    keywords: [],
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
    id: 'intellij',
    name: 'IntelliJ IDEA',
    binary: 'idea',
    isTerminalEditor: false,
    paths: [],
    keywords: ['idea', 'java', 'jetbrains', 'ide'],
  },
  {
    id: 'emacsforosx',
    name: 'GNU Emacs for Mac OS X',
    binary: 'Emacs',
    isTerminalEditor: false,
    isOSXOnly: true,
    paths: ['/Applications/Emacs.app/Contents/MacOS/Emacs'],
    keywords: [],
  },
  {
    id: 'xcode',
    name: 'Xcode',
    binary: 'xed',
    isTerminalEditor: false,
    isOSXOnly: true,
    paths: [
      '/Applications/Xcode.app/Contents/MacOS/Xcode',
      '/Applications/Xcode-beta.app/Contents/MacOS/Xcode',
    ],
    keywords: ['xed'],
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
];

const EDITORS: Editor[] = [...VISUAL_EDITORS, ...TERMINAL_EDITORS];
