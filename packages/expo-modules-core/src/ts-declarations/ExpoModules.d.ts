import { CodedError } from '../errors/CodedError';

declare let global: {
  ExpoModulesCore_CodedError: typeof CodedError;
  ExpoModules:
    | undefined
    | {
        [key: string]: any;
      };
};
