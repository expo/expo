/* eslint-disable no-redeclare */
// Provides dev-time typing structure for  `danger` - doesn't affect runtime.
import { DangerDSLType } from 'danger/distribution/dsl/DangerDSL';

declare global {
  var danger: DangerDSLType;
  // see: https://danger.systems/js/reference.html#communication
  function message(message: string, file?: string, line?: number): void;
  function warn(message: string, file?: string, line?: number): void;
  function fail(message: string, file?: string, line?: number): void;
  function markdown(message: string, file?: string, line?: number): void;
}
