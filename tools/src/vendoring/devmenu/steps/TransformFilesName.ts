import chalk from 'chalk';
import fs from 'fs-extra';
import path from 'path';

import { TransformFilesContent } from './TransformFilesContent';
import { findFiles } from '../utils';

export class TransformFilesName extends TransformFilesContent {
  async execute() {
    const workDirectory = this.getWorkingDirectory();

    this.logSubStep(
      `🔄 find ${chalk.yellow(this.find.toString())} in files names in path ${chalk.green(
        this.overrideWorkingDirectory()
      )}/${chalk.yellow(this.filePattern)} and replace with ${chalk.magenta(this.replace)}`
    );

    const files = await findFiles(workDirectory, this.filePattern);
    await Promise.all(
      files.map((file) => {
        const fileName = path.basename(file).replace(this.find, this.replace);
        const parent = path.dirname(file);

        return fs.rename(file, path.join(parent, fileName));
      })
    );
  }
}

export function renameIOSFiles({
  find,
  replace,
}: {
  find: string;
  replace: string;
}): TransformFilesName {
  return new TransformFilesName({
    filePattern: path.join('ios', '**', `*${find}*.@(m|h)`),
    find,
    replace,
  });
}
