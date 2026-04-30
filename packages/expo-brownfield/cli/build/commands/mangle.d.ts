import type { Command } from 'commander';
/**
 * Internal command spawned by `scripts/ios/mangle.rb` from a Podfile's
 * `post_install` block when the `multipleFrameworks` plugin option is set.
 * Not intended for direct user invocation.
 *
 * Exits with code 1 on any failure with a single-line error message — the
 * Ruby shim surfaces this back to CocoaPods. Without this catch the rejected
 * promise bubbles up to Node's unhandled-rejection handler and prints a noisy
 * stack trace that obscures the actual build failure.
 */
declare const mangle: (command: Command) => Promise<void>;
export default mangle;
