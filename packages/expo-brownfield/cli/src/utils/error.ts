type ErrorType =
  | 'android-task-repo'
  | 'android-directory-not-found'
  | 'android-library-unknown-error'
  | 'android-library-not-found'
  | 'prebuild-cancelled';

class CLIError {
  private static readonly errorSymbol: string = '✖';
  private static readonly errorMessages: Record<ErrorType, string> = {
    'android-task-repo': 'At least one task or repository must be specified',
    'android-directory-not-found': 'Cannot find `android` directory in the project',
    'android-library-unknown-error': 'Unknown error occured while finding brownfield library',
    'android-library-not-found': 'Could not find brownfield library in the project',
    'prebuild-cancelled': 'Brownfield cannot be built without prebuilding the native project',
  };

  public static handle(error: ErrorType, errorMessage: string = '', fatal: boolean = true) {
    const message = errorMessage
      ? `${this.errorMessages[error]}: ${errorMessage}`
      : this.errorMessages[error];
    this.handleInternal(message, fatal);
  }

  private static handleInternal(message: string, fatal: boolean = true) {
    console.error(`${this.errorSymbol} Error: ${message}`);
    if (fatal) {
      process.exit(1);
    }
  }
}

export default CLIError;
