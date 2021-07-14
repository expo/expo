import fs from 'fs';
import path from 'path';

import { getProjectRoot } from '../helpers';

// TODO - expand this to handle android / web when ready
export function clearNativeCache(packageName: string) {
  const projectRoot = getProjectRoot(packageName);
  const podLockfilePath = path.resolve(projectRoot, 'ios', 'Podfile.lock');
  if (fs.existsSync(podLockfilePath)) {
    fs.unlinkSync(podLockfilePath);
  }
}
