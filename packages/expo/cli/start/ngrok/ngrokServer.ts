import * as Log from '../../log';
import { resolveNgrokAsync } from './resolveNgrok';

/** Info about the currently running instance of ngrok. */
let ngrokInfo: { url: string; pid: number } | null = null;

export function setNgrokInfo(info: typeof ngrokInfo) {
  ngrokInfo = info;
}

export function getNgrokInfo() {
  return ngrokInfo;
}

/** Get the active pid from the running instance of ngrok. */
// TODO: Use this instead of a stored local value.
export async function getNgrokActivePidAsync(projectRoot: string) {
  const ngrok = await resolveNgrokAsync(projectRoot, {
    autoInstall: false,
    shouldPrompt: false,
  }).catch(() => null);
  if (!ngrok) {
    return null;
  }
  return ngrok.getActiveProcess().pid ?? null;
}

export function killNgrokInstance() {
  if (ngrokInfo?.pid) {
    try {
      process.kill(ngrokInfo.pid);
    } catch (e) {
      Log.debug(`Couldn't kill ngrok with PID ${ngrokInfo.pid}`);
    }
  }
}
