import chalk from 'chalk';
import fs from 'fs-extra';
import path from 'path';

import { Task } from './Task';
import { toRepoPath, findFiles } from '../utils';

export type CopyFilesSettings = {
  from?: string;
  subDirectory?: string;
  filePattern: string | string[];
  to: string;
};

/**
 *  A task which will copy files from `workingDirectory()/subDirectory/filePatterns` to the provided path.
 *
 * It's searching for file names which match `filePatterns` and then it copies them into `to/<matched_part_of_file_name>`.
 * So the `subDirectory` part won't be copied.
 *
 * If for this file structure:
 *
 * ```
 * android/
 *   src/
 *     main.java
 *   lib/
 *     lib.java
 * ```
 *
 * you runs CopyFiles with:
 * ```
 * {
 *   from: 'android',
 *   subDirectory: 'src|lib',
 *   to: 'copied',
 *   filePatterns: '*'
 * }
 * ```
 * you gets:
 * ```
 * android/
 *   src/
 *     main.java
 *   lib/
 *     lib.java
 * lib/
 *   main.java
 *   lib.java
 * ```
 */
export class CopyFiles extends Task {
  private from?: string;
  private subDirectory?: string;
  private readonly filePattern: string[];
  private readonly to: string;

  /**
   * Using `from` key, you can override the work directory.
   * @param settings
   */
  constructor({ from, subDirectory, filePattern, to }: CopyFilesSettings) {
    super();
    this.from = from;
    this.subDirectory = subDirectory;
    this.to = toRepoPath(to);
    if (typeof filePattern === 'string') {
      this.filePattern = [filePattern];
    } else {
      this.filePattern = filePattern;
    }
  }

  protected overrideWorkingDirectory(): string {
    return this.from || '<workingDirectory>';
  }

  async execute() {
    const workDirectory = this.getWorkingDirectory();

    for (const pattern of this.filePattern) {
      const subPath = this.subDirectory
        ? path.join(workDirectory, this.subDirectory)
        : workDirectory;

      this.logSubStep(
        `📝 copy ${chalk.green(this.overrideWorkingDirectory())}/${chalk.green(
          this.subDirectory ? this.subDirectory + '/' : ''
        )}${chalk.yellow(pattern)} into ${chalk.magenta(this.to)}`
      );

      const files = await findFiles(subPath, pattern);
      await Promise.all(
        files.map(async (file) => {
          const relativeFilePath = path.relative(subPath, file);
          const destinationFullPath = path.join(this.to, relativeFilePath);

          await fs.mkdirs(path.dirname(destinationFullPath));
          return await fs.copy(file, destinationFullPath);
        })
      );
    }
  }
}
