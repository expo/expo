// Provides dev-time typing structure for `danger` - doesn't affect runtime.
import { DangerDSLType } from 'danger/distribution/dsl/DangerDSL';

declare global {
  var danger: DangerDSLType;
  // typescript-eslint raises a false positive when `message` is both the name of the function and
  // one of its parameters
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  function message(message: string, message?: string, line?: number): void;
  function warn(message: string, file?: string, line?: number): void;
  function fail(message: string, file?: string, line?: number): void;
  function markdown(message: string, file?: string, line?: number): void;
}
