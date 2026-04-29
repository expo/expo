import type { Command } from 'commander';
import fs from 'node:fs';

import { runMangle, type MangleContext } from '../utils/mangle';

interface MangleOptions {
  contextJson?: string;
  contextFile?: string;
  verbose?: boolean;
}

const readContext = (options: MangleOptions): MangleContext => {
  let raw: string;
  if (options.contextFile) {
    raw = fs.readFileSync(options.contextFile, 'utf8');
  } else if (options.contextJson) {
    raw = options.contextJson;
  } else {
    throw new Error(
      'expo-brownfield mangle: missing --context-json or --context-file. ' +
        'This command is normally invoked from the Ruby shim during `pod install`.'
    );
  }
  return JSON.parse(raw) as MangleContext;
};

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
const mangle = async (command: Command) => {
  try {
    const options = command.opts<MangleOptions>();
    const context = readContext(options);
    await runMangle(context, { verbose: options.verbose ?? false });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`expo-brownfield mangle: ${message}`);
    process.exit(1);
  }
};

export default mangle;
