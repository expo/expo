import { CommandError, UnimplementedError } from '../../utils/errors';
import { memoize } from '../../utils/fn';

/** An error that is memoized and asserted whenever a Prerequisite.assertAsync is subsequently called. */
export class PrerequisiteCommandError extends CommandError {
  constructor(code: string, message: string = '') {
    super(message ? 'VALIDATE_' + code : code, message);
  }
}

export class Prerequisite<T = void, TProps = void> {
  /** Memoized results of `assertImplementation` */
  private _assertAsync: (props: TProps) => Promise<T>;

  constructor() {
    this._assertAsync = memoize(this.assertImplementation.bind(this));
  }

  /** An optional warning to call before running the memoized assertion.  */
  protected cachedError?: PrerequisiteCommandError;

  /** Reset the assertion memo and warning message. */
  public resetAssertion(props: TProps) {
    this.cachedError = undefined;
    this._assertAsync = memoize(this.assertImplementation.bind(this));
  }

  async assertAsync(props: TProps): Promise<T> {
    if (this.cachedError) {
      throw this.cachedError;
    }
    try {
      return await this._assertAsync(props);
    } catch (error) {
      if (error instanceof PrerequisiteCommandError) {
        this.cachedError = error;
      }
      throw error;
    }
  }

  /** Exposed for testing. */
  async assertImplementation(props: TProps): Promise<T> {
    throw new UnimplementedError();
  }
}

/** A prerequisite that is project specific. */
export class ProjectPrerequisite extends Prerequisite {
  constructor(protected projectRoot: string) {
    super();
  }
}

type PrerequisiteWorker = typeof import('./ProjectPrerequisiteWorker') &
  import('jest-worker').Worker;

/**
 * Wrap a prerequisite class in a jest-worker, for expensive and long running assertions.
 * The result from this method can be used as normal prerequisite class.
 */
export function createPrerequisiteWorker(prerequisiteFile: string): typeof ProjectPrerequisite {
  return class ProjectPrerequisiteWorker extends ProjectPrerequisite {
    private worker: PrerequisiteWorker | null = null;
    private workerFile = prerequisiteFile;

    /**
     * Start the jest worker if it wasn't started already.
     * The worker's output is piped to the main thread.
     */
    public async startWorkerAsync() {
      if (!this.worker) {
        const { Worker: JestWorker } = await import('jest-worker');
        const worker = new JestWorker(require.resolve('./ProjectPrerequisiteWorker'), {
          maxRetries: 1,
          exposedMethods: ['assertImplementation'],
        });

        // Forward the worker's console logs to the main thread.
        worker.getStderr().pipe(process.stderr);
        worker.getStdout().pipe(process.stdout);

        this.worker = worker as PrerequisiteWorker;
      }

      return this.worker;
    }

    /** Stop the worker if it was started */
    public async stopWorkerAsync() {
      if (this.worker) {
        await this.worker.end();
        this.worker = null;
      }
    }

    /** Run the assertion within the worker and throw or cache possible errors in this instance */
    public async assertImplementation(): Promise<void> {
      const worker = await this.startWorkerAsync();
      const result = await worker.assertImplementation(this.workerFile, this.projectRoot);

      // If we want to keep long running workers alive, we need a "destroy" lifecycle method.
      this.stopWorkerAsync();

      if (result.type === 'error') {
        throw result.error;
      } else if (result.type === 'failure') {
        this.cachedError = result.error;
      }
    }
  };
}
