import { PrerequisiteCommandError, ProjectPrerequisite } from './Prerequisite';

/**
 * We can't share the class instance outside this worker.
 * Instead we share serializable custom messages, to unserialize in the wrapping prerequisite class.
 */
export type PrerequisiteWorkerResult =
  | { type: 'success' }
  | { type: 'failure'; error: PrerequisiteCommandError }
  | { type: 'error'; error: Error };

/**
 * Try to maintain the same prerequisite instance, if loaded already.
 * It is possible to lose the instance when the worker is terminated, or when multiple workers are used.
 */
let instance: null | ProjectPrerequisite = null;

/**
 * Dynamically load and execute the prerequisite assertion within this worker instance.
 * This method interprets the result from that instance, and sends it to the wrapping prerequisite class.
 */
export async function assertImplementation(
  prerequisiteFile: string,
  ...props: ConstructorParameters<typeof ProjectPrerequisite>
): Promise<PrerequisiteWorkerResult> {
  try {
    if (!instance) {
      const PrerequisiteClass = require(prerequisiteFile).default as typeof ProjectPrerequisite;
      instance = new PrerequisiteClass(...props);
    }

    await instance.assertImplementation();

    return { type: 'success' };
  } catch (error) {
    return error instanceof PrerequisiteCommandError
      ? { type: 'failure', error }
      : { type: 'error', error: error as Error };
  } finally {
    // Reset this assertion instance whenever an error occurs.
    // The error is cached in the wrapping prerequisite worker class.
    instance?.resetAssertion();
  }
}
