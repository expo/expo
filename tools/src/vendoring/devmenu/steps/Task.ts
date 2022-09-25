import logger from '../../../Logger';
import { toRepoPath } from '../utils';

/**
 * A base class for all task.
 * It provides a simple task launcher, log utils and path to working directory.
 */
export abstract class Task {
  private workingDirectory?: string;

  /**
   * Tasks can contain multiple steps. This function provides a consistent way to log information about each step.
   * @param message
   */
  protected logSubStep(message: string) {
    logger.info(`> ${message}`);
  }

  /**
   * A function which provides a consistent way of printing debug information inside a task.
   * @param message which will be printed using debug log level.
   */
  protected logDebugInfo(message: string | string[]) {
    if (typeof message === 'string') {
      logger.debug(`  ${message}`);
    } else {
      logger.debug(`  ${message.join('\n    ')}`);
    }
  }

  /**
   * We want to have a way to change working directory using task's settings.
   * For example, we could run pipe in the temp directory but one task from it in the repo.
   * It's ignored if `null` was returned.
   * @returns the override working directory for task.
   */
  protected overrideWorkingDirectory(): string | null {
    return null;
  }

  /**
   * @returns the absolute path to working directory for task based on overrideWorkDirectory().
   */
  protected getWorkingDirectory(): string {
    const overrideValue = this.overrideWorkingDirectory();
    if (overrideValue && overrideValue !== '<workingDirectory>') {
      return toRepoPath(overrideValue);
    }

    return this.workingDirectory!;
  }

  /**
   * Sets the working directory for the task.
   * @param workingDirectory
   */
  public setWorkingDirectory(workingDirectory: string) {
    this.workingDirectory = workingDirectory;
  }

  /**
   * A function which will be call in start method. The body of the task.
   */
  protected abstract execute(): Promise<void>;

  /**
   * A method that starts the task. It provides error handling.
   */
  public async start() {
    try {
      await this.execute();
    } catch (e) {
      logger.error(e);
    }
  }
}
