import fs from 'fs-extra';
import path from 'path';

import { Task } from './Task';
import { findFiles } from '../utils';

export type PrefixHeadersSettings = {
  source?: string;
  subPath: string;
  prefix: string;
  filePattern: string;
  debug?: boolean;
};

export class PrefixHeaders extends Task {
  protected readonly source?: string;
  protected readonly subPath: string;
  protected readonly prefix: string;
  protected readonly filePattern: string;
  protected readonly debug: boolean;

  constructor({ source, subPath, prefix, filePattern, debug }: PrefixHeadersSettings) {
    super();
    this.source = source;
    this.subPath = subPath;
    this.prefix = prefix;
    this.filePattern = filePattern;
    this.debug = debug || false;
  }

  protected overrideWorkingDirectory(): string {
    return this.source || '<workingDirectory>';
  }

  async execute() {
    const workDirectory = this.getWorkingDirectory();

    this.logSubStep(`🔄 prefix headers`);

    const headersPath = await findFiles(path.join(workDirectory, this.subPath), '**/*.@(h|hpp)');
    if (this.debug) {
      this.logDebugInfo('Headers: ' + headersPath.join('\n'));
    }

    const headers = headersPath.map((x) => path.parse(x));
    await Promise.all(
      headers.map((header) => {
        const fileName = this.prefix + header.base;
        const parent = header.dir;
        return fs.rename(path.join(header.dir, header.base), path.join(parent, fileName));
      })
    );

    const files = await findFiles(workDirectory, this.filePattern);
    if (this.debug) {
      this.logDebugInfo('Files: ' + files.join('\n'));
    }

    await Promise.all(
      files.map(async (file) => {
        const content = await fs.readFile(file, 'utf8');
        const transformedContent = headers.reduce((acc, header) => {
          const regex = `(#include.*)${header.base}"`;
          return acc.replace(new RegExp(regex, 'g'), `$1${this.prefix}${header.base}"`);
        }, content);
        return await fs.writeFile(file, transformedContent, 'utf8');
      })
    );
  }
}
