import JsonFile, { JSONObject } from '@expo/json-file';
import chalk from 'chalk';
import fs from 'fs-extra';

import Git from './Git';
import logger from './Logger';

/**
 * Descriptor of single task. Defines class members and the main function.
 */
export type TaskDescriptor<Args extends any[]> = {
  /**
   * Name of the task.
   */
  name: string;

  /**
   * A list of other tasks this task depends on. All these tasks will be executed before this one.
   */
  dependsOn?: Task<Args>[] | Task<Args>;

  /**
   * File paths to stage in the repository.
   */
  filesToStage?: string[] | string;

  /**
   * Task is required and thus will be run even if restored from the backup.
   */
  required?: boolean;

  /**
   * Whether it makes sense to save a backup after this task is completed.
   */
  backupable?: boolean;
};

/**
 * Handy return type for methods that might be asynchronous.
 */
type Promiseable<T> = T | Promise<T>;

/**
 * An object that is being passed to TaskRunner constructor and provides some customization.
 */
export type TaskRunnerDescriptor<Args extends any[], BackupDataType = null> = {
  tasks: Task<Args>[] | Task<Args>;
  backupFilePath?: string | null;
  backupExpirationTime?: number;
  validateBackup?: (backup) => Promiseable<boolean>;
  shouldUseBackup?: (backup) => Promiseable<boolean>;
  restoreBackup?: (backup, ...args: Args) => Promiseable<void>;
  createBackupData?: (task, ...args: Args) => Promiseable<BackupDataType | null>;
  backupValidationFailed?: (backup) => void;
  taskSucceeded?: (task: Task<Args>) => void;
  taskFailed?: (task: Task<Args>, error: any) => void;
};

/**
 * An object that is being stored in the backup file.
 */
export type TasksRunnerBackup<DataType extends JSONObject | null = null> = {
  tasks: string[];
  resolvedTasks: string[];
  lastTask: string;
  timestamp: number;
  data: DataType | null;
};

/**
 * Signature of the function is being executed as part of the task.
 */
export type TaskFunction<Args extends any[]> = (...args: Args) => Promise<void | symbol | Args>;

/**
 * Class of error that might be thrown when running tasks.
 */
export class TaskError<TaskType extends { name: string }> extends Error {
  readonly stderr?: string;
  readonly stack?: string;

  constructor(
    readonly task: TaskType,
    error: Error
  ) {
    super(error.message);
    this.stderr = (error as any).stderr;
    this.stack = error.stack;
  }
}

/**
 * Task runner, as its name suggests, runs given task. One task can depend on other tasks
 * and the runner makes sure they all are being run. Runner also provides an easy way to
 * backup and restore tasks' state.
 */
export class TaskRunner<Args extends any[], BackupDataType extends JSONObject | null = null>
  implements TaskRunnerDescriptor<Args, BackupDataType>
{
  // Descriptor properties
  readonly tasks: Task<Args>[];

  readonly backupFilePath: string | null = null;

  readonly backupExpirationTime: number = 60 * 60 * 1000;

  readonly validateBackup: (backup: TasksRunnerBackup<BackupDataType>) => Promiseable<boolean> =
    () => true;

  readonly shouldUseBackup: (backup: TasksRunnerBackup<BackupDataType>) => Promiseable<boolean> =
    () => true;

  readonly restoreBackup: (
    backup: TasksRunnerBackup<BackupDataType>,
    ...args: Args
  ) => Promiseable<void> = () => {};

  readonly createBackupData: (task, ...args: Args) => BackupDataType | null = () => null;

  readonly backupValidationFailed?: (backup) => void;

  readonly taskSucceeded?: (task: Task<Args>) => any;

  readonly taskFailed?: (task: Task<Args>, error: Error) => any;

  readonly resolvedTasks: Task<Args>[];

  constructor(descriptor: TaskRunnerDescriptor<Args, BackupDataType>) {
    const { tasks, ...rest } = descriptor;

    this.tasks = ([] as Task<Args>[]).concat(tasks);
    this.resolvedTasks = resolveTasksList(this.tasks);

    Object.assign(this, rest);
  }

  /**
   * Resolves to a boolean value determining whether the backup file exists.
   */
  async backupExistsAsync(): Promise<boolean> {
    if (!this.backupFilePath) {
      return false;
    }
    try {
      await fs.access(this.backupFilePath, fs.constants.R_OK);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Returns action's backup if it exists and is still valid, `null` otherwise.
   */
  async getBackupAsync(): Promise<TasksRunnerBackup<BackupDataType> | null> {
    if (!this.backupFilePath || !(await this.backupExistsAsync())) {
      return null;
    }
    const backup = await JsonFile.readAsync<TasksRunnerBackup<BackupDataType>>(this.backupFilePath);

    if (!(await this.isBackupValid(backup))) {
      await this.backupValidationFailed?.(backup);
      return null;
    }
    return !this.shouldUseBackup || (await this.shouldUseBackup(backup)) ? backup : null;
  }

  /**
   * Validates backup compatibility with options passed to the command.
   */
  async isBackupValid(backup: TasksRunnerBackup<BackupDataType>): Promise<boolean> {
    const tasksComparator = (a, b) => a === b.name;

    if (
      Date.now() - backup.timestamp < this.backupExpirationTime &&
      arraysCompare(backup.resolvedTasks, this.resolvedTasks, tasksComparator) &&
      arraysCompare(backup.tasks, this.tasks, tasksComparator)
    ) {
      return (await this.validateBackup?.(backup)) ?? true;
    }
    return false;
  }

  /**
   * Saves backup of tasks state.
   */
  async saveBackup(task: Task<Args>, ...args: Args) {
    if (!this.backupFilePath) {
      return;
    }

    const data = await this.createBackupData(task, ...args);
    const backup: TasksRunnerBackup<BackupDataType> = {
      timestamp: Date.now(),
      tasks: this.tasks.map((task) => task.name),
      resolvedTasks: this.resolvedTasks.map((task) => task.name),
      lastTask: task.name,
      data,
    };
    await fs.outputFile(this.backupFilePath, JSON.stringify(backup, null, 2));
  }

  /**
   * Removes backup file if specified. Must be synchronous.
   */
  invalidateBackup() {
    if (this.backupFilePath) {
      fs.removeSync(this.backupFilePath);
    }
  }

  /**
   * Restores backup if possible and executes tasks until they stop, throw or finish. Re-throws task errors.
   */
  async runAsync(...args: Args): Promise<Args> {
    const backup = await this.getBackupAsync();
    const startingIndex = backup
      ? this.resolvedTasks.findIndex((task) => task.name === backup.lastTask) + 1
      : 0;

    if (backup) {
      await this.restoreBackup(backup, ...args);
    }

    // Filter tasks to run: required ones and all those after last backup.
    const tasks = this.resolvedTasks.filter((task, taskIndex) => {
      return task.required || taskIndex >= startingIndex;
    });

    let nextArgs: Args = args;

    for (const task of tasks) {
      try {
        const result = await task.taskFunction?.(...nextArgs);

        // The task has stopped further tasks execution.
        if (result === Task.STOP) {
          break;
        }
        if (Array.isArray(result)) {
          nextArgs = result;
        }

        // Stage declared files in local repository. This is also a part of the backup.
        await Git.addFilesAsync(task.filesToStage);
      } catch (error) {
        // Discard unstaged changes in declared files.
        await Git.discardFilesAsync(task.filesToStage);

        this.taskFailed?.(task, error);
        throw new TaskError<Task<Args>>(task, error);
      }

      this.taskSucceeded?.(task);

      if (task.backupable) {
        // Make a backup after each successful backupable task.
        await this.saveBackup(task, ...args);
      }
    }

    // If we reach here - we're done and backup should be invalidated.
    this.invalidateBackup();

    return nextArgs;
  }

  /**
   * Same as `runAsync` but handles caught errors and calls `process.exit`.
   */
  async runAndExitAsync(...args: Args): Promise<void> {
    try {
      await this.runAsync(...args);
      process.exit(0);
    } catch (error) {
      logger.error();

      if (error instanceof TaskError) {
        logger.error(`💥 Execution failed for task ${chalk.cyan(error.task.name)}.`);
      }

      logger.error('💥 Error:', error.message);

      if (error.stack) {
        const stack = error.stack.split(`${error.message}\n`);
        logger.debug(stack[1]);
      }

      error.stderr && logger.error('💥 stderr output:\n', chalk.reset(error.stderr));
      process.exit(1);
    }
  }
}

export class Task<Args extends any[] = []> implements TaskDescriptor<Args> {
  static STOP: symbol = Symbol();

  readonly name: string;
  readonly dependsOn: Task<Args>[] = [];
  readonly filesToStage: string[] = [];
  readonly required: boolean = false;
  readonly backupable: boolean = true;
  readonly taskFunction?: TaskFunction<Args>;

  constructor(descriptor: TaskDescriptor<Args> | string, taskFunction?: TaskFunction<Args>) {
    if (typeof descriptor === 'string') {
      this.name = descriptor;
    } else {
      const { name, dependsOn, filesToStage, required, backupable } = descriptor;
      this.name = name;
      this.dependsOn = dependsOn ? ([] as Task<Args>[]).concat(dependsOn) : [];
      this.filesToStage = filesToStage ? ([] as string[]).concat(filesToStage) : [];
      this.required = required ?? this.required;
      this.backupable = backupable ?? this.backupable;
    }
    this.taskFunction = taskFunction;
  }
}

function resolveTasksList<Args extends any[]>(tasks: Task<Args>[]): Task<Args>[] {
  const list = new Set<Task<Args>>();

  function iterateThroughDependencies(task: Task<Args>) {
    for (const dependency of task.dependsOn) {
      iterateThroughDependencies(dependency);
    }
    list.add(task);
  }

  tasks.forEach((task) => iterateThroughDependencies(task));

  return [...list];
}

function arraysCompare(arr1, arr2, comparator = (a, b) => a === b): boolean {
  return arr1.length === arr2.length && arr1.every((item, index) => comparator(item, arr2[index]));
}
