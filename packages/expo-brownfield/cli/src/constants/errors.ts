import type { ArgError } from 'arg';

/**
 * Prints a generic error message.
 *
 * @param error - The error object.
 */
const genericError = (error: unknown) => {
  if (error instanceof Error) {
    console.error(`Error: ${error.message}`);
  } else {
    console.error('Error: An unknown error occurred');
  }
  return process.exit(1);
};

/**
 * Prints the error message for failed inference.
 */
const inferenceError = (valueName: string) => {
  console.error(`Error: Value of ${valueName} could not be inferred from the project`);
  return process.exit(1);
};

/**
 * Prints the error message for failed argument parsing.
 */
const parseArgsError = () => {
  console.error('Error: failed to parse arguments');
  return process.exit(1);
};

/**
 * Prints the error message for an unknown command.
 */
const unknownCommandError = () => {
  console.error(`
Error: unknown command
Supported commands: build-android, build-ios, tasks-android`);
  return process.exit(1);
};

/**
 * Prints the error message for an unknown option.
 *
 * @param argError - The error object.
 */
const unkownOptionError = (argError: ArgError) => {
  const message = argError.message.replace('ArgError: ', '');
  console.error(`Error: ${message}`);
  return process.exit(1);
};

export const Errors = {
  generic: genericError,
  inference: inferenceError,
  parseArgs: parseArgsError,
  unknownCommand: unknownCommandError,
  unknownOption: unkownOptionError,
} as const;
