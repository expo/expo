type ErrorType =
  | 'android-task-repo'
  | 'android-directory-not-found'
  | 'android-library-unknown-error'
  | 'android-library-not-found'
  | 'ios-artifacts-directory-unknown-error'
  | 'ios-directory-not-found'
  | 'ios-directory-unknown-error'
  | 'ios-hermes-framework-not-found'
  | 'ios-scheme-not-found'
  | 'ios-workspace-not-found'
  | 'ios-workspace-unknown-error'
  | 'prebuild-cancelled';

class CLIError {
  private static readonly errorSymbol: string = '✖';
  private static readonly errorMessages: Record<ErrorType, string> = {
    'android-task-repo': 'At least one task or repository must be specified',
    'android-directory-not-found': 'Cannot find `android` directory in the project',
    'android-library-unknown-error': 'Unknown error occurred while finding brownfield library',
    'android-library-not-found': 'Could not find brownfield library in the project',
    'ios-artifacts-directory-unknown-error':
      'Unknown error occurred while creating artifacts directory',
    'ios-directory-not-found': 'Cannot find `ios` directory in the project',
    'ios-directory-unknown-error': 'Unknown error occurred while finding brownfield iOS scheme',
    'ios-hermes-framework-not-found': 'Could not find hermes framework in the project at path',
    'ios-scheme-not-found': 'Could not find brownfield iOS scheme',
    'ios-workspace-not-found': 'Could not find brownfield iOS workspace',
    'ios-workspace-unknown-error': 'Unknown error occurred while finding brownfield iOS workspace',
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
