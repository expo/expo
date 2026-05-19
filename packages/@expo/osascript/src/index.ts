import spawnAsync, { SpawnOptions, SpawnResult } from '@expo/spawn-async';
import path from 'path';

function escapeString(value: string): string {
  return value
    .replace(/\\/g, '\\\\')
    .replace(/"/g, '\\"')
    .replace(/\r/g, '\\r')
    .replace(/\n/g, '\\n')
    .replace(/\t/g, '\\t');
}

function shellQuote(value: string): string {
  return `'${value.replace(/'/g, `'\\''`)}'`;
}

function osascriptArgs(script: string | string[]): string[] {
  if (!Array.isArray(script)) {
    script = [script];
  }

  const args = [];
  for (const line of script) {
    args.push('-e');
    args.push(line);
  }

  return args;
}

async function osascriptSpawnAsync(
  script: string | string[],
  opts?: SpawnOptions
): Promise<SpawnResult> {
  return await spawnAsync('osascript', osascriptArgs(script), opts);
}

async function isAppRunningAsync(appName: string): Promise<boolean> {
  const { stdout } = await osascriptSpawnAsync(
    `tell app "System Events" to count processes whose name is "${escapeString(appName)}"`
  );
  return stdout.trim() !== '0';
}

async function safeIdOfAppAsync(appName: string): Promise<string | null> {
  try {
    const { stdout } = await osascriptSpawnAsync(`id of app "${escapeString(appName)}"`);
    return stdout.trim();
  } catch {
    return null;
  }
}

async function openFinderToFolderAsync(dir: string, activate = true): Promise<void> {
  await osascriptSpawnAsync([
    'tell application "Finder"',
    `open POSIX file "${escapeString(dir)}"`,
    (activate && 'activate') || '',
    'end tell',
  ]);
}

async function openInAppAsync(appName: string, pth: string): Promise<SpawnResult> {
  return await osascriptSpawnAsync(
    `tell app "${escapeString(appName)}" to open "${escapeString(path.resolve(pth))}"`
  );
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
  const shellCommand = escapeString(`cd ${shellQuote(dir)} && clear`);
  return await osascriptSpawnAsync([
    'tell application "iTerm"',
    'make new terminal',
    'tell the first terminal',
    'activate current session',
    'launch session "Default Session"',
    'tell the last session',
    `write text "${shellCommand}"`,
    'end tell',
    'end tell',
    'end tell',
  ]);
}

async function openTerminalToSpecificFolderAsync(dir: string, inTab = false): Promise<SpawnResult> {
  const shellCommand = escapeString(`cd ${shellQuote(dir)} && clear`);
  if (inTab) {
    return await osascriptSpawnAsync([
      'tell application "terminal"',
      'tell application "System Events" to tell process "terminal" to keystroke "t" using command down',
      `do script with command "${shellCommand}" in selected tab of the front window`,
      'end tell',
    ]);
  } else {
    return await osascriptSpawnAsync([
      'tell application "terminal"',
      `do script "${shellCommand}"`,
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

/** @deprecated */
async function osascriptExecAsync(script: string | string[], opts?: SpawnOptions): Promise<string> {
  return (await osascriptSpawnAsync(script, opts)).stdout.trim();
}

export {
  chooseAppAsync,
  chooseEditorAppAsync,
  chooseTerminalAppAsync,
  escapeString,
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
