import fs from 'fs-extra';
import { styleText } from 'node:util';

import { Task } from './Task';
import { findFiles } from '../utils';

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
      `🚮 Remove ${styleText('green', this.overrideWorkingDirectory())}/${styleText('yellow', this.filePattern)}`
    );

    const files = await findFiles(workDirectory, this.filePattern);
    await Promise.all(
      files.map((file) => {
        return fs.remove(file);
      })
    );
  }
}
