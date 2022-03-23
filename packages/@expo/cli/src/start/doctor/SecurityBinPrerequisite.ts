import spawnAsync from '@expo/spawn-async';

import { Prerequisite, PrerequisiteCommandError } from './Prerequisite';

export class SecurityBinPrerequisite extends Prerequisite {
  static instance = new SecurityBinPrerequisite();

  async assertImplementation(): Promise<void> {
    try {
      // make sure we can run security
      await spawnAsync('which', ['security']);
    } catch {
      throw new PrerequisiteCommandError(
        'SECURITY_BIN',
        "Cannot code sign project because the CLI `security` is not available on your computer.\nPlease ensure it's installed and try again."
      );
    }
  }
}
