type ErrorType = 'android-task-repo' | 'android-directory-not-found' | 'android-library-unknown-error' | 'android-library-not-found' | 'prebuild-cancelled';
declare class CLIError {
    private static readonly errorSymbol;
    private static readonly errorMessages;
    static handle(error: ErrorType, errorMessage?: string, fatal?: boolean): void;
    private static handleInternal;
}
export default CLIError;
