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
export class ProjectPrerequisite<T = void, TProps = void> extends Prerequisite<T, TProps> {
  constructor(protected projectRoot: string) {
    super();
  }
}
