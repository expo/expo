import type { TaskManagerError } from 'expo-task-manager';

import type { Position } from './Position.types';

/**
 * The parameters of `defineLocationTask`.
 */
export type LocationTaskOptions = {
  /**
   * The name of the task. Must match the name passed to the `LocationUpdatesHandle` constructor;
   * both default to the same name.
   */
  taskName?: string;
  /**
   * Called with every position delivered to the task.
   */
  onPosition: (position: Position) => void;
  /**
   * Called when the task receives an error instead of a position.
   */
  onError?: (error: TaskManagerError) => void;
};
