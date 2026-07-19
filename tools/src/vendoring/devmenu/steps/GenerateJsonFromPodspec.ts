import chalk from 'chalk';
import fs from 'fs-extra';
import path from 'path';

import { Task } from './Task';
import { readPodspecAsync } from '../../../CocoaPods';
import { toRepoPath } from '../utils';

type GenerateJsonFromPodspecSettings = {
  from: string;
  saveTo: string;
  transform: (map: Record<string, any>) => Promise<Record<string, any>>;
};

export class GenerateJsonFromPodspec extends Task {
  protected readonly from: string;
  protected readonly saveTo: string;
  protected readonly transform: (map: Record<string, any>) => Promise<Record<string, any>>;

  constructor({ from, saveTo, transform }: GenerateJsonFromPodspecSettings) {
    super();
    this.from = from;
    this.saveTo = toRepoPath(saveTo);
    this.transform = transform;
  }

  async execute() {
    const workDirectory = this.getWorkingDirectory();

    this.logSubStep(
      `➕ generating podspec from ${chalk.green('<workingDirectory>')}/${chalk.green(this.from)}`
    );
    const podspec = await readPodspecAsync(path.join(workDirectory, this.from));
    const transformedPodspec = await this.transform(podspec);
    return await fs.writeFile(this.saveTo, JSON.stringify(transformedPodspec, null, 2));
  }
}
