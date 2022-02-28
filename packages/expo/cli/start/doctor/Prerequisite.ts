import { CommandError, UnimplementedError } from '../../utils/errors';
import { memoize } from '../../utils/fn';

/** An error that is memoized and asserted whenever a Prerequisite.assertAsync is subsequently called. */
export class PrerequisiteCommandError extends CommandError {
  constructor(code: string, message: string = '') {
    super(message ? 'VALIDATE_' + code : code, message);
  }
}

export class Prerequisite {
  /** Memoized results of `assertImplementation` */
  private _assertAsync: () => Promise<void>;

  constructor() {
    this._assertAsync = memoize(this.assertImplementation.bind(this));
  }

  /** An optional warning to call before running the memoized assertion.  */
  protected cachedError?: PrerequisiteCommandError;

  /** Reset the assertion memo and warning message. */
  public resetAssertion() {
    this.cachedError = undefined;
    this._assertAsync = memoize(this.assertImplementation.bind(this));
  }

  async assertAsync(): Promise<void> {
    if (this.cachedError) {
      throw this.cachedError;
    }
    try {
      return await this._assertAsync();
    } catch (error) {
      if (error instanceof PrerequisiteCommandError) {
        this.cachedError = error;
      }
      throw error;
    }
  }

  /** Exposed for testing. */
  async assertImplementation(): Promise<void> {
    throw new UnimplementedError();
  }
}

/** A prerequisite that is project specific. */
export class ProjectPrerequisite extends Prerequisite {
  constructor(protected projectRoot: string) {
    super();
  }
}
