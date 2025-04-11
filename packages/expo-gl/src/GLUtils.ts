import GLErrors from './GLErrors';
import { ExpoWebGLRenderingContext, GLLoggingOption } from './GLView.types';

/**
 * Maximum length of the strings printed to the console.
 */
const MAX_STRING_LENGTH = 20;

/**
 * Sets up `__expoSetLogging` method providing some logging options useful when debugging GL calls.
 */
export function configureLogging(gl: ExpoWebGLRenderingContext): void {
  // Enable/disable logging of all GL function calls
  let loggingOption = GLLoggingOption.DISABLED;

  gl.__expoSetLogging = (option: GLLoggingOption): void => {
    // If boolean values are the same, just change the internal value,
    // there is no need to wrap/unwrap functions in this case.
    if (!loggingOption === !option) {
      loggingOption = option;
      return;
    }

    const __gl = gl as Record<keyof typeof gl | string, any>;

    // Turn off logging.
    if (option === GLLoggingOption.DISABLED || !option) {
      Object.entries(__gl).forEach(([key, value]) => {
        if (typeof value === 'function' && value.__logWrapper) {
          delete __gl[key];
        }
      });
      loggingOption = option;
      return;
    }

    // Turn on logging.
    Object.entries(Object.getPrototypeOf(__gl)).forEach(([key, originalValue]) => {
      if (typeof originalValue !== 'function' || key === '__expoSetLogging') {
        return;
      }

      __gl[key] = (...args: any[]) => {
        if (loggingOption & GLLoggingOption.METHOD_CALLS) {
          const params = args.map((arg) => {
            // If the type is `number`, then try to find name of the constant that has such value,
            // so it's easier to read these logs. In some cases it might be misleading
            // if the parameter is for example a width or height, so the number is still logged.
            if (loggingOption & GLLoggingOption.RESOLVE_CONSTANTS && typeof arg === 'number') {
              for (const prop in __gl) {
                if (__gl[prop] === arg) {
                  return `${arg} (${prop})`;
                }
              }
            }

            // Truncate strings so they don't produce too much output and don't block the bridge.
            // It mostly applies to shaders which might be very long...
            if (loggingOption & GLLoggingOption.TRUNCATE_STRINGS && typeof arg === 'string') {
              if (arg.length > MAX_STRING_LENGTH) {
                const lastIndex = arg.lastIndexOf(' ', MAX_STRING_LENGTH);
                return arg.substr(0, lastIndex >= 0 ? lastIndex : MAX_STRING_LENGTH) + '...';
              }
            }

            // Just return the parameter as a string.
            return '' + arg;
          });
          console.log(`ExpoGL: ${key}(${params.join(', ')})`);
        }

        const result = originalValue.apply(__gl, args);

        if (loggingOption & GLLoggingOption.METHOD_CALLS) {
          console.log(`ExpoGL:   = ${result}`);
        }
        if (loggingOption & GLLoggingOption.GET_ERRORS && key !== 'getError') {
          // @ts-ignore We need to call into the original `getError`.
          // eslint-disable-next-line no-proto
          const error = __gl.__proto__.getError.call(__gl);

          if (error && error !== __gl.NO_ERROR) {
            // `console.error` would cause a red screen, so let's just log with red color.
            console.log(`\x1b[31mExpoGL: Error ${GLErrors[error as keyof typeof GLErrors]}\x1b[0m`);
          }
        }
        __gl[key].__logWrapper = true;
        return result;
      };
    });

    loggingOption = option;
  };
}
