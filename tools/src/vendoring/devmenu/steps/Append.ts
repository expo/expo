import chalk from 'chalk';
import fs from 'fs-extra';

import { findFiles } from '../utils';
import { Task } from './Task';

export type AppendSettings = {
  source?: string;
  filePattern: string;
  append: string;
};

/**
 * A task which will append to files content.
 */
export class Append extends Task {
  protected readonly source?: string;
  protected readonly filePattern: string;
  protected readonly append: string;

  constructor({ source, filePattern, append }: AppendSettings) {
    super();
    this.source = source;
    this.filePattern = filePattern;
    this.append = append;
  }

  protected overrideWorkingDirectory(): string | undefined {
    return this.source;
  }

  async execute() {
    const workDirectory = this.getWorkingDirectory();

    this.logSubStep(
      `➕ append to ${chalk.green(
        this.overrideWorkingDirectory() || '<workingDirectory>'
      )}/${chalk.yellow(this.filePattern)}`
    );

    const files = await findFiles(workDirectory, this.filePattern);

    await Promise.all(
      files.map(async (file) => {
        return await fs.appendFile(file, this.append);
      })
    );
  }
}
