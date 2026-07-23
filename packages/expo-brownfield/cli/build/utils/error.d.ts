type ErrorType = 'android-task-repo' | 'android-directory-not-found' | 'android-library-unknown-error' | 'android-library-not-found' | 'ios-artifacts-directory-unknown-error' | 'ios-directory-not-found' | 'ios-directory-unknown-error' | 'ios-framework-not-found' | 'ios-hermes-framework-not-found' | 'ios-host-provided-without-prebuilds' | 'ios-pod-install-cancelled' | 'ios-prebuilds-spm-dep-flavor-mismatch' | 'ios-prebuilds-spm-dep-missing' | 'ios-scheme-name-collision' | 'ios-scheme-not-found' | 'ios-workspace-not-found' | 'ios-workspace-unknown-error' | 'package-not-installed' | 'plugin-not-configured' | 'prebuild-cancelled';
declare class CLIError {
    private static readonly errorSymbol;
    private static readonly errorMessages;
    static handle(error: ErrorType, errorMessage?: string, fatal?: boolean): void;
    private static handleInternal;
}
export default CLIError;
