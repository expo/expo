const additionalCommandError = (command: string) => {
  console.error(`Error: Command ${command} doesn't support additional commands
For all available options please use the help command:
npx expo-brownfield ${command} --help`);
  return process.exit(1);
};

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
 * Prints the error message for missing tasks or repositories.
 */
const missingTasksOrRepositoriesError = () => {
  console.error('Error: At least one task or repository must be specified');
  return process.exit(1);
};

/**
 * Prints the error message for failed argument parsing.
 */
const parseArgsError = () => {
  console.error('Error: failed to parse arguments');
  return process.exit(1);
};

export const Errors = {
  additionalCommand: additionalCommandError,
  generic: genericError,
  inference: inferenceError,
  missingTasksOrRepositories: missingTasksOrRepositoriesError,
  parseArgs: parseArgsError,
} as const;
