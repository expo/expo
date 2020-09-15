import { TransformFilesContent, FileContentTransformStepSettings } from './TransformFilesContent';
import chalk from 'chalk';
import path from 'path';
import fs from 'fs-extra';
import { findFiles } from '../utils';

export class TransformFilesName extends TransformFilesContent {
  constructor({ name, ...settings }: FileContentTransformStepSettings) {
    super({ ...settings, name: name || 'rename files' });
  }

  async execute() {
    const workDirectory = this.getWorkingDirectory();

    this.logSubStep(
      `find ${chalk.yellow(this.find.toString())} in files names in path ${chalk.green(
        workDirectory
      )}/${chalk.yellow(this.filePattern)} and replace with ${chalk.magenta(this.replace)}`
    );

    const files = await findFiles(workDirectory, this.filePattern);
    this.logDebugInfo('file affected: ');
    this.logDebugInfo(files.map((file) => `- ${file}`));

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
    name: 'rename ios source files',
    filePattern: path.join('ios', '**', `*${find}*.@(m|h)`),
    find,
    replace,
  });
}
