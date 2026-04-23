import type { CodedError } from '../errors/CodedError';

declare let global: {
  ExpoModulesCore_CodedError: typeof CodedError;
};
