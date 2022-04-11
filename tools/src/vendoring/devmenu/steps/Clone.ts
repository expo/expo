import spawnAsync from '@expo/spawn-async';
import chalk from 'chalk';
import fs from 'fs-extra';

import { Task } from './Task';

type CloneSettings =
  | {
      branch: string;
    }
  | {
      tag: string;
    }
  | {
      commit: string;
    }
  | object;

export type CloneRepoSettings = {
  url: string;
  destination?: string;
} & CloneSettings;

/**
 * A task which will clone repository into the provided destination or into the working directory.
 */
export class Clone extends Task {
  private readonly url: string;
  private readonly options: CloneSettings;
  private destination?: string;

  constructor({ url, destination, ...options }: CloneRepoSettings) {
    super();
    this.url = url;
    this.destination = destination;
    this.options = options;
  }

  protected overrideWorkingDirectory(): string {
    return this.destination || '<workingDirectory>';
  }

  async execute() {
    const workDirectory = this.getWorkingDirectory();

    this.logSubStep(`🧹 remove ${chalk.yellow(this.overrideWorkingDirectory())}`);
    await fs.remove(workDirectory);

    this.logSubStep(
      `📩 clone repo ${chalk.green(this.url)} into ${chalk.yellow(this.overrideWorkingDirectory())}`
    );

    const cloneArguments = this.cloneArguments();
    this.logDebugInfo(`run git clone ${cloneArguments.join(' ')}`);
    await spawnAsync('git', ['clone', ...cloneArguments, this.url, workDirectory]);

    if ('commit' in this.options) {
      this.logDebugInfo(`run git checkout ${this.options.commit}`);
      await spawnAsync('git', ['checkout', this.options.commit], { cwd: workDirectory });
    }
  }

  cloneArguments(): string[] {
    // if a branch or tag was provided, we don't need to clone the whole repo.
    const args = ['--depth', '1'];
    if ('branch' in this.options) {
      args.push('--branch', this.options.branch);
    } else if ('tag' in this.options) {
      args.push('--branch', this.options.tag);
    } else if ('commit' in this.options) {
      return [];
    }
    return args;
  }
}
