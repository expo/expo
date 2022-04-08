import chalk from 'chalk';
import fs from 'fs-extra';

import { Task } from './Task';

export type RemoveDirectorySettings = {
  target?: string;
  name?: string;
};

/**
 * A task which will remove the working directory.
 */
export class RemoveDirectory extends Task {
  private target?: string;

  constructor({ target }: RemoveDirectorySettings) {
    super();
    this.target = target;
  }

  protected overrideWorkingDirectory(): string | undefined {
    return this.target;
  }

  async execute() {
    const workDirectory = this.getWorkingDirectory();

    this.logSubStep(
      `🧹 remove ${chalk.yellow(this.overrideWorkingDirectory() || '<workingDirectory>')}`
    );
    return await fs.remove(workDirectory);
  }
}
