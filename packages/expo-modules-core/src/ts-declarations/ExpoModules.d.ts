import { CodedError } from '../errors/CodedError';
import NativeException from '../errors/NativeException';

type ExpoObject = {
  core: ExpoCoreObject;
  modules:
    | undefined
    | {
        [key: string]: any;
      };
};

type ExpoCoreObject = {
  NativeException: typeof NativeException;
};

declare global {
  // eslint-disable-next-line no-var
  var expo: ExpoObject | undefined;

  /**
   * @deprecated `global.ExpoModules` is deprecated, use `global.expo.modules` instead.
   */
  // eslint-disable-next-line no-var
  var ExpoModules:
    | undefined
    | {
        [key: string]: any;
      };

  // eslint-disable-next-line no-var
  var ExpoModulesCore_CodedError: typeof CodedError;
}
