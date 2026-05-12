import { ExpoRunFormatter } from '@expo/xcpretty';
import chalk from 'chalk';
import { spawn } from 'child_process';
import os from 'os';

import logger from '../Logger';
import { createAsyncSpinner, isNonInteractive } from './Utils';

/**
 * Spawns xcodebuild with a spinner that shows the current build action.
 * Uses createAsyncSpinner for consistent CI/TTY handling across the codebase.
 */
export async function spawnXcodeBuildWithSpinner(
  args: string[],
  cwd: string,
  spinnerText: string
): Promise<{ code: number | null; results: string; error: string }> {
  const isCI = isNonInteractive();
  const formatter = ExpoRunFormatter.create(cwd, {
    isDebug: isCI,
  });

  const spinner = createAsyncSpinner(spinnerText);

  const buildProcess = spawn('xcodebuild', args, { cwd });

  let results = '';
  let error = '';
  let currentBuffer = '';

  const flushBuffer = () => {
    if (!currentBuffer) return;
    const data = currentBuffer;
    currentBuffer = '';

    // Pipe through formatter and update spinner with each line
    for (const line of formatter.pipe(data)) {
      if (line.trim()) {
        spinner.info(`${spinnerText} ${line}`);
      }
    }
  };

  buildProcess.stdout.on('data', (data: Buffer) => {
    const stringData = data.toString();
    results += stringData;
    currentBuffer += stringData;
    // Flush when we have complete lines
    if (currentBuffer.endsWith(os.EOL)) {
      flushBuffer();
    }
  });

  buildProcess.stderr.on('data', (data: Buffer) => {
    const stringData = data.toString();
    error += stringData;
  });

  return new Promise((resolve) => {
    buildProcess.on('close', (code: number) => {
      flushBuffer(); // Flush any remaining data

      const summary = formatter.getBuildSummary();
      const hasWarnings = formatter.warnings.length > 0;
      const warningCount = formatter.warnings.length;
      // Only add warning count if summary doesn't already include it
      const summaryHasWarnings = summary.toLowerCase().includes('warning');
      const warningText =
        warningCount > 0 && !summaryHasWarnings
          ? ` (${warningCount} warning${warningCount > 1 ? 's' : ''})`
          : '';

      if (code === 0) {
        // Use warn spinner if there are warnings, succeed otherwise
        const statusText = `${spinnerText} ${summary.trim()}${warningText}`;
        if (hasWarnings) {
          spinner.warn(statusText);
          // Surface the actual warnings even on success — without this, CI
          // logs only see the count and have no way to triage what changed.
          printDiagnostics(formatter.warnings, []);
        } else {
          spinner.succeed(statusText);
        }
      } else {
        spinner.fail(`${spinnerText} failed with code ${code}`);
        summary && logger.error('\n' + summary.trim() + '\n');
        printDiagnostics(formatter.warnings, formatter.errors);
        if (formatter.errors.length === 0) {
          printRawErrorFallback(results, error);
        }
      }

      resolve({ code, results, error });
    });
  });
}

/**
 * Print formatted compile warnings and errors. Used on both success-with-
 * warnings and failure, so CI always surfaces diagnostics regardless of
 * overall build status.
 */
function printDiagnostics(warnings: string[], errors: string[]): void {
  const MAX = 10;

  if (warnings.length > 0) {
    logger.log(chalk.gray('      Warnings:'));
    warnings.slice(0, MAX).forEach((warn) => logger.log(chalk.gray(`        ${warn}`)));
    if (warnings.length > MAX) {
      logger.log(chalk.gray(`        ... and ${warnings.length - MAX} more warnings`));
    }
  }

  if (errors.length > 0) {
    logger.log(chalk.gray('      Errors:'));
    errors.slice(0, MAX).forEach((err) => logger.log(chalk.gray(`        ${err.trim()}`)));
    if (errors.length > MAX) {
      logger.log(chalk.gray(`        ... and ${errors.length - MAX} more errors`));
    }
  }
}

/**
 * Print fallback raw errors when the xcodebuild failed but the formatter
 * didn't capture structured errors. Called only on failure.
 */
function printRawErrorFallback(rawOutput: string, stderr: string): void {
  const rawErrors = extractRawCompileErrors(rawOutput);
  if (rawErrors.length > 0) {
    logger.log(chalk.gray('      Raw errors:'));
    rawErrors.slice(0, 10).forEach((err) => logger.log(chalk.gray(`        ${err}`)));
  } else if (stderr) {
    logger.log(chalk.gray(stderr));
  }
}

/**
 * Extract raw compile errors from xcodebuild output.
 * This is a fallback for when xcpretty's formatter doesn't capture errors
 * (e.g., multi-line fatal errors with modern clang diagnostic format).
 */
function extractRawCompileErrors(output: string): string[] {
  const errors: string[] = [];
  const lines = output.split('\n');

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    // Match lines like: /path/to/file.cpp:2:10: fatal error: 'Header.h' file
    // or: /path/to/file.cpp:2:10: error: something
    if (/:\d+:\d+:\s*(?:fatal\s+)?error:/.test(line)) {
      // Collect the error and subsequent context lines (source line, caret indicator)
      const errorLines = [line];
      // Look ahead for continuation lines (indented or containing source/caret indicators)
      for (let j = i + 1; j < lines.length && j < i + 6; j++) {
        const nextLine = lines[j];
        // Stop if we hit another file path or empty line followed by non-error content
        if (/^\s*$/.test(nextLine)) {
          break;
        }
        // Include continuation lines (indented error text, source lines with |, caret lines)
        if (
          /^\s+/.test(nextLine) ||
          /^\s*\d+\s*\|/.test(nextLine) ||
          /^\s*\|?\s*[\s~]*\^/.test(nextLine)
        ) {
          errorLines.push(nextLine);
        } else if (/^\d+ errors? generated/.test(nextLine)) {
          // Include the "N error(s) generated" summary
          errorLines.push(nextLine);
          break;
        } else {
          break;
        }
      }
      errors.push(errorLines.join('\n'));
    }
  }

  return errors;
}
