import { ExpoRunFormatter } from '@expo/xcpretty';
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
      if (spinner) {
        if (code === 0) {
          spinner.succeed(`${spinnerText} ${summary.trim()}`);
          // Show warnings even on success
          if (formatter.warnings.length > 0) {
            formatter.warnings.forEach((warn) => logger.warn(`     ⚠️  ${warn}`));
          }
        } else {
          spinner.fail(`Build failed with code ${code}`);
          summary && logger.error('\n' + summary.trim() + '\n');
          // On failure, log warnings first, then errors
          if (formatter.warnings.length > 0) {
            logger.warn('\nWarnings:');
            formatter.warnings.forEach((warn) => logger.warn(`  ${warn}`));
          }
          if (formatter.errors.length > 0) {
            logger.error('\nErrors:');
            formatter.errors.forEach((err) => logger.info(`  ${err.trim()}`));
          }
          // If formatter didn't capture any errors, fall back to showing raw output
          // This catches errors that slip through xcpretty's regex patterns (e.g., multi-line errors)
          if (formatter.errors.length === 0) {
            const rawErrors = extractRawCompileErrors(results);
            if (rawErrors.length > 0) {
              rawErrors.forEach((err) => logger.log(`  ${err}`));
            } else if (error) {
              logger.log(error);
            }
          }
        }
      } else {
        // CI or verbose mode - log with prefix for context
        if (code === 0) {
          logger.log(`   ✔ ${spinnerText} ${summary.trim()}`);
        } else {
          logger.error(`   ✖ ${spinnerText} failed with code ${code}`);
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
