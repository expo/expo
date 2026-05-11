import * as osascript from '@expo/osascript';
import spawnAsync from '@expo/spawn-async';
import os from 'os';
import path from 'path';

/** Splits an inline script into trimmed, non-empty lines for `osascript -e <line>`. */
function applescript(strings: TemplateStringsArray, ...values: unknown[]): string[] {
  let raw = strings[0]!;
  for (let i = 0; i < values.length; i++) {
    raw += String(values[i]) + strings[i + 1];
  }
  return raw
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line.length > 0);
}

/** Escapes a value for safe interpolation inside an AppleScript double-quoted string. */
function escapeAppleScriptString(value: string): string {
  return value
    .replace(/\\/g, '\\\\')
    .replace(/"/g, '\\"')
    .replace(/\r/g, '\\r')
    .replace(/\n/g, '\\n');
}

// See: https://github.com/ExiaSR/better-opn/blob/master/openChrome.applescript
// MIT License, Copyright (c) 2015-present, Facebook, Inc. (originally from create-react-app)
function buildOpenChromiumTabScript(target: string, matchUrl: string, browser: string): string[] {
  const theURL = escapeAppleScriptString(target);
  const matchURL = escapeAppleScriptString(matchUrl);
  const theProgram = escapeAppleScriptString(browser);
  return applescript`
    property targetTab: null
    property targetTabIndex: -1
    property targetWindow: null
    property theProgram: "${theProgram}"

    on run
      set theURL to "${theURL}"
      set matchURL to "${matchURL}"
      using terms from application "Google Chrome"
        tell application theProgram
          if (count every window) = 0 then
            make new window
          end if
          set found to my lookupTabWithUrl(matchURL)
          if found then
            set targetWindow's active tab index to targetTabIndex
            tell targetTab to reload
            tell targetWindow to activate
            set index of targetWindow to 1
            return
          end if
          set found to my lookupTabWithUrl("chrome://newtab/")
          if found then
            set targetWindow's active tab index to targetTabIndex
            set URL of targetTab to theURL
            tell targetWindow to activate
            return
          end if
          tell window 1
            activate
            make new tab with properties {URL:theURL}
          end tell
        end tell
      end using terms from
    end run

    on lookupTabWithUrl(lookupUrl)
      using terms from application "Google Chrome"
        tell application theProgram
          set found to false
          set theTabIndex to -1
          repeat with theWindow in every window
            set theTabIndex to 0
            repeat with theTab in every tab of theWindow
              set theTabIndex to theTabIndex + 1
              if (theTab's URL as string) contains lookupUrl then
                set targetTab to theTab
                set targetTabIndex to theTabIndex
                set targetWindow to theWindow
                set found to true
                exit repeat
              end if
            end repeat
            if found then exit repeat
          end repeat
        end tell
      end using terms from
      return found
    end lookupTabWithUrl
  `;
}

const CHROMIUM_BROWSERS = [
  'Google Chrome Canary',
  'Google Chrome',
  'Microsoft Edge',
  'Brave Browser',
  'Vivaldi',
  'Chromium',
];

function safeOrigin(target: string): string {
  try {
    return new URL(target).origin;
  } catch {
    return target;
  }
}

async function tryOpenInChromiumTabAsync(target: string): Promise<boolean> {
  const matchUrl = process.env.OPEN_MATCH_HOST_ONLY === 'true' ? safeOrigin(target) : target;
  for (const browser of CHROMIUM_BROWSERS) {
    const running = await osascript.isAppRunningAsync(browser).catch(() => false);
    if (!running) continue;
    try {
      await osascript.spawnAsync(buildOpenChromiumTabScript(target, matchUrl, browser), {
        stdio: 'ignore',
      });
      return true;
    } catch {
      // Try the next browser.
    }
  }
  return false;
}

/**
 * Opens a URL in the user's browser. Honors `BROWSER` (set to `none` to disable) and
 * `BROWSER_ARGS` environment variables. On macOS, reuses an existing tab in a running
 * Chromium-based browser when possible.
 *
 * @returns `true` when a browser was launched, `false` when `BROWSER=none`.
 */
export async function openBrowserAsync(target: string): Promise<boolean> {
  const browserEnv = process.env.BROWSER?.trim();
  if (browserEnv?.toLowerCase() === 'none') {
    return false;
  }

  // On macOS, `BROWSER=open` historically meant "use the default handler" rather than
  // "launch an app called open" — treat it as if BROWSER were unset.
  const browserApp =
    browserEnv && !(process.platform === 'darwin' && browserEnv.toLowerCase() === 'open')
      ? browserEnv
      : undefined;
  const browserArgs = process.env.BROWSER_ARGS ? process.env.BROWSER_ARGS.split(' ') : [];

  if (process.platform === 'darwin') {
    const isDefaultOrChrome = !browserApp || browserApp.toLowerCase() === 'google chrome';
    if (isDefaultOrChrome && (await tryOpenInChromiumTabAsync(target))) {
      return true;
    }
    const openArgs: string[] = [];
    if (browserApp) openArgs.push('-a', browserApp);
    // Per `open(1)`, everything following `--args` is forwarded to the launched app,
    // so the target URL must come after the args block to reach the app alongside them.
    if (browserArgs.length > 0) openArgs.push('--args', ...browserArgs);
    openArgs.push(target);
    await spawnAsync('open', openArgs, { stdio: 'ignore' });
    return true;
  }

  if (process.platform === 'win32') {
    await spawnWindowsStartAsync(target, browserApp, browserArgs);
    return true;
  }

  // WSL: when the user hasn't overridden BROWSER, route through Windows `cmd.exe` so
  // the URL opens in the user's Windows browser. Falls through to `xdg-open` otherwise.
  if (!browserApp && isWsl()) {
    await spawnAsync('/mnt/c/Windows/System32/cmd.exe', ['/c', 'start', '""', target], {
      stdio: 'ignore',
    });
    return true;
  }

  const command = browserApp ?? 'xdg-open';
  await spawnAsync(command, [...browserArgs, target], { stdio: 'ignore' });
  return true;
}

async function spawnWindowsStartAsync(
  target: string,
  browserApp: string | undefined,
  browserArgs: string[]
): Promise<void> {
  // Windows preserves env var case in Node, but the OS variable is `SystemRoot`.
  const systemRoot = process.env.SYSTEMROOT ?? process.env.SystemRoot ?? 'C:\\Windows';
  const cmd = path.join(systemRoot, 'System32', 'cmd.exe');
  // `start ""` — the empty quoted string is the window title, so the URL isn't
  // interpreted as a title argument.
  const startArgs = ['/c', 'start', '""'];
  if (browserApp) startArgs.push(browserApp);
  startArgs.push(target, ...browserArgs);
  await spawnAsync(cmd, startArgs, { stdio: 'ignore' });
}

function isWsl(): boolean {
  if (process.platform !== 'linux') return false;
  if (process.env.WSL_DISTRO_NAME) return true;
  const release = os.release().toLowerCase();
  return release.includes('microsoft') || release.includes('wsl');
}
