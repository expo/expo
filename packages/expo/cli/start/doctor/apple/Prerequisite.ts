import { UnimplementedError } from '../../../utils/errors';
import { memoize } from '../../../utils/fn';

export class Prerequisite {
  /** Memoized results of `assertImplementation` */
  assertAsync: () => Promise<void>;

  constructor() {
    this.assertAsync = memoize(this.assertImplementation);
  }

  /** Exposed for testing. */
  async assertImplementation(): Promise<void> {
    throw new UnimplementedError();
  }
}
