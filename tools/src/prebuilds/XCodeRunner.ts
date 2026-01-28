import { ExpoRunFormatter } from '@expo/xcpretty';
import chalk from 'chalk';
import { spawn } from 'child_process';
import ora, { Ora } from 'ora';
import os from 'os';

import logger from '../Logger';

/**
 * Spawns xcodebuild with a spinner that shows the current build action.
 * In verbose mode (EXPO_DEBUG), it logs all formatted output instead.
 */
export async function spawnXcodeBuildWithSpinner(
  args: string[],
  cwd: string,
  spinnerText: string
): Promise<{ code: number | null; results: string; error: string }> {
  const isVerbose = process.env.EXPO_DEBUG === '1';
  const isCI = process.env.CI === '1' || process.env.CI === 'true';
  const formatter = ExpoRunFormatter.create(cwd, {
    isDebug: isVerbose || isCI,
  });

  const spinner: Ora | null =
    isVerbose || isCI ? null : ora({ text: spinnerText, prefixText: '  ' }).start();

  const buildProcess = spawn('xcodebuild', args, { cwd });

  let results = '';
  let error = '';
  let currentBuffer = '';

  const flushBuffer = () => {
    if (!currentBuffer) return;
    const data = currentBuffer;
    currentBuffer = '';

    // Pipe through formatter and either log or update spinner
    for (const line of formatter.pipe(data)) {
      if (isVerbose || isCI) {
        logger.log(line);
      } else if (spinner && line.trim()) {
        // Update spinner with the latest action (keep it concise)
        spinner.text = `${spinnerText} ${line}`;
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

      if (spinner) {
        if (code === 0) {
          // Use warn spinner if there are warnings, succeed otherwise
          const statusText = `${spinnerText} ${summary.trim()}${warningText}`;
          if (hasWarnings) {
            spinner.warn(statusText);
            // Only show warning details in verbose mode
            if (isVerbose) {
              formatter.warnings.forEach((warn) => logger.log(chalk.gray(`        ${warn}`)));
            }
          } else {
            spinner.succeed(statusText);
          }
        } else {
          spinner.fail(`Build failed with code ${code}`);
          summary && logger.error('\n' + summary.trim() + '\n');

          // On failure, show warnings first (consistent with SPMVerify)
          if (hasWarnings) {
            logger.log(chalk.gray('      Warnings:'));
            formatter.warnings
              .slice(0, 10)
              .forEach((warn) => logger.log(chalk.gray(`        ${warn}`)));
            if (warningCount > 10) {
              logger.log(chalk.gray(`        ... and ${warningCount - 10} more warnings`));
            }
          }

          // Show errors (consistent with SPMVerify style)
          if (formatter.errors.length > 0) {
            logger.log(chalk.gray('      Errors:'));
            formatter.errors
              .slice(0, 10)
              .forEach((err) => logger.log(chalk.gray(`        ${err.trim()}`)));
            if (formatter.errors.length > 10) {
              logger.log(chalk.gray(`        ... and ${formatter.errors.length - 10} more errors`));
            }
          }

          // If formatter didn't capture any errors, fall back to showing raw output
          if (formatter.errors.length === 0) {
            const rawErrors = extractRawCompileErrors(results);
            if (rawErrors.length > 0) {
              logger.log(chalk.gray('      Raw errors:'));
              rawErrors.slice(0, 10).forEach((err) => logger.log(chalk.gray(`        ${err}`)));
            } else if (error) {
              logger.log(chalk.gray(error));
            }
          }
        }
      } else {
        // CI or verbose mode - log with prefix for context
        if (code === 0) {
          const symbol = hasWarnings ? chalk.yellow('⚠') : chalk.green('✔');
          logger.log(`   ${symbol} ${spinnerText} ${summary.trim()}${warningText}`);
          if (hasWarnings && isVerbose) {
            formatter.warnings.forEach((warn) => logger.log(chalk.gray(`        ${warn}`)));
          }
        } else {
          logger.error(`   ${chalk.red('✖')} ${spinnerText} failed with code ${code}`);
          summary && logger.error('\n' + summary.trim() + '\n');
        }
      }

      resolve({ code, results, error });
    });
  });
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
