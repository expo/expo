import { PrerequisiteCommandError, ProjectPrerequisite } from './Prerequisite';

type PrerequisiteWorkerResult =
  | { type: 'success' }
  | { type: 'failure'; error: PrerequisiteCommandError }
  | { type: 'error'; error: Error };

/**
 * Dynamically load the prerequisite class within the jest worker.
 * This is executed from a wrapped Prerequisite class, from `createPrerequisiteWorker`.
 * Once initialized, the prerequisite methods are piped from the original thread to the worker.
 */
function createInstance(
  prerequisiteFile: string,
  ...params: ConstructorParameters<typeof ProjectPrerequisite>
): ProjectPrerequisite {
  const PrerequisiteClass = require(prerequisiteFile).default as typeof ProjectPrerequisite;
  return new PrerequisiteClass(...params);
}

/** Execute the prerequisite assertion within this worker instance */
export async function assertImplementation(
  ...params: Parameters<typeof createInstance>
): Promise<PrerequisiteWorkerResult> {
  try {
    const instance = createInstance(...params);
    await instance.assertImplementation();

    return { type: 'success' };
  } catch (error) {
    if (error instanceof PrerequisiteCommandError) {
      return { type: 'failure', error };
    }

    return { type: 'error', error: error as Error };
  }
}
