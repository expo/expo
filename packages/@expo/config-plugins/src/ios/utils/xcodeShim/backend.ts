import getenv from 'getenv';
import type { XcodeProject } from 'xcode';
import xcode from 'xcode';

import { project as shimProject } from './index';

// Whether iOS pbxproj handling uses the legacy `xcode` package. Defaults to true
// during Phase 1 of the `@bacons/xcode` migration (the shim is opt-in via
// `EXPO_USE_LEGACY_XCODE=0`, used by the A/B build rig); Phase 3 flips the default.
export function shouldUseLegacyXcode(): boolean {
  return getenv.boolish('EXPO_USE_LEGACY_XCODE', true);
}

/** Open and parse a `project.pbxproj`, routed through legacy `xcode` or the shim. */
export function openXcodeProject(filePath: string): XcodeProject {
  const project = shouldUseLegacyXcode() ? xcode.project(filePath) : shimProject(filePath);
  project.parseSync();
  return project as XcodeProject;
}
