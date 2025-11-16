import process from 'node:process';

const EXTRA_MODULE_BUILD_TYPES = ["plugin", "cli", "utils", "scripts"];

const ENV_CI = "CI";
const ENV_EXPO_NONINTERACTIVE = "EXPO_NONINTERACTIVE";

export function getExtraModuleBuildTypes() {
  return EXTRA_MODULE_BUILD_TYPES
}

export function setExpoNonInteractive() {
  process.env[ENV_EXPO_NONINTERACTIVE] = 1;
}

export function isInteractiveSession() {
  const isCiSession = !!process.env[ENV_CI];
  const isNonInteractiveSession = !!process.env[ENV_EXPO_NONINTERACTIVE];

  // TODO: -t 1 equivalent check here.

  return !isCiSession && !isNonInteractiveSession;
}