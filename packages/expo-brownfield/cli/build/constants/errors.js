"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Errors = void 0;
/**
 * Prints a generic error message.
 *
 * @param error - The error object.
 */
const genericError = (error) => {
    if (error instanceof Error) {
        console.error(`Error: ${error.message}`);
    }
    else {
        console.error('Error: An unknown error occurred');
    }
    return process.exit(1);
};
/**
 * Prints the error message for failed inference.
 */
const inferenceError = (valueName) => {
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
exports.Errors = {
    generic: genericError,
    inference: inferenceError,
    missingTasksOrRepositories: missingTasksOrRepositoriesError,
    parseArgs: parseArgsError,
};
