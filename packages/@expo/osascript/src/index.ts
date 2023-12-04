/**
 * Utilities for working with `osascript` which runs AppleScript on Macs
 */
'use strict';

import spawnAsync, { SpawnOptions, SpawnResult } from '@expo/spawn-async';
import execAsync, { ExecAsyncOptions } from 'exec-async';
import path from 'path';
import util from 'util';

function osascriptArgs(script: string | string[]): string[] {
  if (!util.isArray(script)) {
    script = [script];
  }

  const args = [];
  for (const line of script) {
    args.push('-e');
    args.push(line);
  }

  return args;
}

async function osascriptExecAsync(
  script: string | string[],
  opts?: ExecAsyncOptions
): Promise<string> {
  return await execAsync(
    'osascript',
    osascriptArgs(script),
    Object.assign({ stdio: 'inherit' }, opts)
  );
}

async function osascriptSpawnAsync(
  script: string | string[],
  opts?: SpawnOptions
): Promise<SpawnResult> {
  return await spawnAsync('osascript', osascriptArgs(script), opts);
}

async function isAppRunningAsync(appName: string): Promise<boolean> {
  const zeroMeansNo = (
    await osascriptExecAsync(
      'tell app "System Events" to count processes whose name is ' + JSON.stringify(appName)
    )
  ).trim();
  return zeroMeansNo !== '0';
}

async function safeIdOfAppAsync(appName: string): Promise<string | null> {
  try {
    return (await osascriptExecAsync('id of app ' + JSON.stringify(appName))).trim();
  } catch {
    return null;
  }
}

async function openFinderToFolderAsync(dir: string, activate = true): Promise<void> {
  await osascriptSpawnAsync([
    'tell application "Finder"',
    'open POSIX file ' + JSON.stringify(dir),
    (activate && 'activate') || '',
    'end tell',
  ]);
}

async function openInAppAsync(appName: string, pth: string): Promise<SpawnResult> {
  const cmd =
    'tell app ' + JSON.stringify(appName) + ' to open ' + JSON.stringify(path.resolve(pth));
  // console.log("cmd=", cmd);
  return await osascriptSpawnAsync(cmd);
}

async function chooseAppAsync(listOfAppNames: string[]): Promise<string | null> {
  const runningAwaitables = [];
  const appIdAwaitables = [];
  for (const appName of listOfAppNames) {
    runningAwaitables.push(isAppRunningAsync(appName));
    appIdAwaitables.push(safeIdOfAppAsync(appName));
  }
  const running = await Promise.all(runningAwaitables);
  const appIds = await Promise.all(appIdAwaitables);

  let i;
  for (i = 0; i < listOfAppNames.length; i++) {
    if (running[i]) {
      return listOfAppNames[i];
    }
  }

  for (i = 0; i < listOfAppNames.length; i++) {
    if (appIds[i]) {
      return listOfAppNames[i];
    }
  }

  return null;
}

async function chooseEditorAppAsync(preferredEditor?: string): Promise<string | null> {
  if (preferredEditor) {
    // Make sure this editor exists
    const appId = await safeIdOfAppAsync(preferredEditor);
    if (appId) {
      return preferredEditor;
    } else {
      console.warn(`Your preferred editor (${preferredEditor}) isn't installed on this computer.`);
    }
  }

  const editorsToTry = [
    'Visual Studio Code',
    'Atom',
    'Sublime Text',
    'TextMate',
    'TextWrangler',
    'Visual Studio Code',
    'Brackets',
    'SubEthaEdit',
    'BBEdit',
    'Textastic',
    'UltraEdit',
    'MacVim',
    'CodeRunner 2',
    'CodeRunner',
    'TextEdit',
  ];

  return await chooseAppAsync(editorsToTry);
}

async function chooseTerminalAppAsync(): Promise<string | null> {
  return await chooseAppAsync([
    'iTerm 3',
    'iTerm 2',
    'iTerm',
    'HyperTerm',
    // 'Cathode',
    // 'Terminator',
    // 'MacTerm',
    'Terminal',
  ]);
}

async function openInEditorAsync(pth: string, preferredEditor?: string): Promise<SpawnResult> {
  const appName = await chooseEditorAppAsync(preferredEditor);
  if (!appName) {
    throw new Error('No editor found.');
  }
  console.log('Will open in ' + appName + ' -- ' + pth);
  return await openInAppAsync(appName, pth);
}

async function openItermToSpecificFolderAsync(dir: string): Promise<SpawnResult> {
  return await osascriptSpawnAsync([
    'tell application "iTerm"',
    'make new terminal',
    'tell the first terminal',
    'activate current session',
    'launch session "Default Session"',
    'tell the last session',
    'write text "cd ' + util.inspect(dir) + ' && clear"',
    // 'write text "clear"',
    'end tell',
    'end tell',
    'end tell',
  ]);
  // exec("osascript -e 'tell application \"iTerm\"' -e 'make new terminal' -e 'tell the first terminal' -e 'activate current session' -e 'launch session \"Default Session\"' -e 'tell the last session' -e 'write text \"cd #{value}\"' -e 'write text \"clear\"' -e 'end tell' -e 'end tell' -e 'end tell' > /dev/null 2>&1")
}

async function openTerminalToSpecificFolderAsync(dir: string, inTab = false): Promise<SpawnResult> {
  if (inTab) {
    return await osascriptSpawnAsync([
      'tell application "terminal"',
      'tell application "System Events" to tell process "terminal" to keystroke "t" using command down',
      'do script with command "cd ' +
        util.inspect(dir) +
        ' && clear" in selected tab of the front window',
      'end tell',
    ]);
  } else {
    return await osascriptSpawnAsync([
      'tell application "terminal"',
      'do script "cd ' + util.inspect(dir) + ' && clear"',
      'end tell',
      'tell application "terminal" to activate',
    ]);
  }
}

async function openFolderInTerminalAppAsync(dir: string, inTab = false): Promise<SpawnResult> {
  const program = await chooseTerminalAppAsync();

  switch (program) {
    case 'iTerm':
      return await openItermToSpecificFolderAsync(dir);

    case 'Terminal':
    default:
      return await openTerminalToSpecificFolderAsync(dir, inTab);
  }
}

export {
  chooseAppAsync,
  chooseEditorAppAsync,
  chooseTerminalAppAsync,
  osascriptExecAsync as execAsync,
  isAppRunningAsync,
  openFinderToFolderAsync,
  openFolderInTerminalAppAsync,
  openInAppAsync,
  openInEditorAsync,
  openItermToSpecificFolderAsync,
  openTerminalToSpecificFolderAsync,
  safeIdOfAppAsync,
  osascriptSpawnAsync as spawnAsync,
};
