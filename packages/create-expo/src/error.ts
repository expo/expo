/**
 * A custom error class that is used to surface a `process.exit` event to a higher
 * level where it can be tracked through telemetry asynchronously, before exiting.
 */
export class ExitError extends Error {
  constructor(
    public cause: string | Error,
    public code: number
  ) {
    super(cause instanceof Error ? cause.message : cause);
  }
}

/**
 * Thrown when `--swiftpm` is used with a template or example whose React Native version cannot
 * build with Swift Package Manager. The section log prints the message, so it is an `ExitError`.
 */
export class SwiftPMUnsupportedError extends ExitError {
  constructor(source: 'template' | 'example', reactNativeVersion: string, projectDir: string) {
    super(
      `Could not create the project with --swiftpm because the ${source} uses React Native ${reactNativeVersion}. ` +
        'Swift Package Manager for iOS requires React Native 0.88 or later. ' +
        `Delete the ${projectDir} directory, then choose ${source === 'template' ? 'a template' : 'an example'} for a newer Expo SDK, or run the command again without --swiftpm to use CocoaPods.`,
      1
    );
  }
}
