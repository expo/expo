import chalk from 'chalk';
import fs from 'fs-extra';
import path from 'path';

import { Task } from './Task';
import { findFiles } from '../utils';

export type FileContentTransformStepSettings = {
  source?: string;
  filePattern: string;
  find: string;
  replace: string;
  debug?: boolean;
};

/**
 * A task which will transformed files content.
 * Firstly, it's searching for all files which matched the `filePattern` in the working directory.
 * Then it'll find the provided pattern and replace it with a new value.
 */
export class TransformFilesContent extends Task {
  protected readonly source?: string;
  protected readonly filePattern: string;
  protected readonly find: RegExp;
  protected readonly replace: string;
  protected readonly debug: boolean;

  constructor({ source, filePattern, find, replace, debug }: FileContentTransformStepSettings) {
    super();
    this.source = source;
    this.filePattern = filePattern;
    this.find = new RegExp(find, 'gm');
    this.replace = replace;
    this.debug = debug || false;
  }

  protected overrideWorkingDirectory(): string {
    return this.source || '<workingDirectory>';
  }

  async execute() {
    const workDirectory = this.getWorkingDirectory();

    this.logSubStep(
      `🔄 find ${chalk.yellow(this.find.toString())} in ${chalk.green(
        this.overrideWorkingDirectory()
      )}/${chalk.yellow(this.filePattern)} and replace with ${chalk.magenta(this.replace)}`
    );

    const files = await findFiles(workDirectory, this.filePattern);
    if (this.debug) {
      this.logDebugInfo('Files: ' + files.join('\n'));
    }
    await Promise.all(
      files.map(async (file) => {
        const content = await fs.readFile(file, 'utf8');
        const transformedContent = content.replace(this.find, this.replace);
        return await fs.writeFile(file, transformedContent, 'utf8');
      })
    );
  }
}

export const prefixPackage = ({
  packageName,
  prefix,
}: {
  source?: string;
  packageName: string;
  prefix: string;
}): TransformFilesContent => {
  return new TransformFilesContent({
    filePattern: path.join('android', '**', '*.@(java|kt)'),
    find: packageName,
    replace: `${prefix}.${packageName}`,
  });
};

export const renameIOSSymbols = (settings: {
  find: string;
  replace: string;
}): TransformFilesContent => {
  return new TransformFilesContent({
    ...settings,
    filePattern: path.join('ios', '**', '*.@(h|m|mm)'),
  });
};
