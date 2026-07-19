const osascript = jest.requireActual('@expo/osascript') as typeof import('@expo/osascript');

export const escapeString = osascript.escapeString;

export const chooseAppAsync = jest.fn(async () => {});
export const chooseEditorAppAsync = jest.fn(async () => {});
export const chooseTerminalAppAsync = jest.fn(async () => {});
export const execAsync = jest.fn(async () => {});
export const isAppRunningAsync = jest.fn(async () => {});
export const openFinderToFolderAsync = jest.fn(async () => {});
export const openFolderInTerminalAppAsync = jest.fn(async () => {});
export const openInAppAsync = jest.fn(async () => {});
export const openInEditorAsync = jest.fn(async () => {});
export const openItermToSpecificFolderAsync = jest.fn(async () => {});
export const openTerminalToSpecificFolderAsync = jest.fn(async () => {});
export const safeIdOfAppAsync = jest.fn(async () => {});
export const spawnAsync = jest.fn(async () => {});
