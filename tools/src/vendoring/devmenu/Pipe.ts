import chalk from 'chalk';

import { Task } from './steps/Task';
import logger from '../../Logger';

export type Platform = 'ios' | 'android' | 'all';

export type PlatformSpecificTask = {
  task: Task;
  platform: Platform;
};

/**
 * A simple task executor, which sets the working directory for all task and runs them one by one.
 * Moreover it can start only tasks for the selected platform.
 */
export class Pipe {
  private readonly platformSpecificTasks: PlatformSpecificTask[];
  protected workingDirectory: string | undefined;

  constructor() {
    this.platformSpecificTasks = [];
  }

  public setWorkingDirectory(workingDirectory: string): this {
    this.workingDirectory = workingDirectory;
    return this;
  }

  /**
   * This method accepts two types of arguments:
   * - string - indicates the platform on which the following tasks will be registered
   * - task
   *
   * ```
   * Pipe().addSteps(
   *    T1,
   *    T2,
   *  'android',
   *    T3A,
   *  'ios',
   *    T3I,
   *  'all',
   *    T4
   * );
   *
   * will resolve to:
   * - if platform = 'all' -> [T1, T2, T3A, T3I, T4]
   * - if platform = 'ios' -> [T1, T2, T3I, T4]
   * - if platform = 'android' -> [T1, T2, T3A, T4]
   * ```
   */
  public addSteps(...tasks: (Task | string | Task[])[]): this {
    let currentPlatform: Platform = 'all';
    tasks.forEach((task) => {
      if (typeof task === 'string') {
        currentPlatform = task as Platform;
        return;
      }

      if (Array.isArray(task)) {
        this.platformSpecificTasks.push(
          ...task.map((t) => ({ platform: currentPlatform, task: t }))
        );
        return;
      }

      this.platformSpecificTasks.push({ platform: currentPlatform, task });
    });

    return this;
  }

  public async start(platform: Platform) {
    logger.debug(`Staring pipe for platform = ${chalk.green(platform)}`);
    logger.debug(
      `${chalk.green('<workingDirectory>')} = ${chalk.yellow(this.workingDirectory || '')}`
    );
    logger.debug();

    const tasks = this.platformSpecificTasks
      .filter((platformSpecificStep) => {
        const { platform: stepPlatform } = platformSpecificStep;
        if (platform === 'all' || stepPlatform === 'all') {
          return true;
        }

        if (platform === stepPlatform) {
          return true;
        }

        return false;
      })
      .map(({ task }) => task);

    for (const task of tasks) {
      if (this.workingDirectory) {
        task.setWorkingDirectory(this.workingDirectory);
      }
      await task.start();
    }
  }
}
