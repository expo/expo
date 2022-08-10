import chalk from 'chalk';
import fs from 'fs-extra';

import { findFiles } from '../utils';
import { Task } from './Task';

export type RemoveFilesSettings = {
  source?: string;
  filePattern: string;
};

export class RemoveFiles extends Task {
  protected readonly source?: string;
  protected readonly filePattern: string;

  constructor({ source, filePattern }: RemoveFilesSettings) {
    super();
    this.source = source;
    this.filePattern = filePattern;
  }

  protected overrideWorkingDirectory(): string {
    return this.source || '<workingDirectory>';
  }

  async execute() {
    const workDirectory = this.getWorkingDirectory();

    this.logSubStep(
      `🚮 Remove ${chalk.green(this.overrideWorkingDirectory())}/${chalk.yellow(this.filePattern)}`
    );

    const files = await findFiles(workDirectory, this.filePattern);
    await Promise.all(
      files.map((file) => {
        return fs.remove(file);
      })
    );
  }
}
