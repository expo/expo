import chalk from 'chalk';
import fs from 'fs-extra';
import path from 'path';

import { readPodspecAsync } from '../../../CocoaPods';
import { toRepoPath } from '../utils';
import { Task } from './Task';

type GenerateJsonFromPodspecSettings = {
  from: string;
  saveTo: string;
  transfrom: (map: Record<string, any>) => Promise<Record<string, any>>;
};

export class GenerateJsonFromPodspec extends Task {
  protected readonly from: string;
  protected readonly saveTo: string;
  protected readonly transfrom: (map: Record<string, any>) => Promise<Record<string, any>>;

  constructor({ from, saveTo, transfrom }: GenerateJsonFromPodspecSettings) {
    super();
    this.from = from;
    this.saveTo = toRepoPath(saveTo);
    this.transfrom = transfrom;
  }

  async execute() {
    const workDirectory = this.getWorkingDirectory();

    this.logSubStep(
      `➕ generating podspec from ${chalk.green('<workingDirectory>')}/${chalk.green(this.from)}`
    );
    const podspec = await readPodspecAsync(path.join(workDirectory, this.from));
    const transformedPodspec = await this.transfrom(podspec);
    return await fs.writeFile(this.saveTo, JSON.stringify(transformedPodspec, null, 2));
  }
}
