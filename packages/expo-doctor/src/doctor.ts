import { getConfig } from '@expo/config';
import chalk from 'chalk';

import { DoctorCheck, DoctorCheckParams, DoctorCheckResult } from './checks/checks.types';
import { resolveChecksInScope } from './utils/checkResolver';
import { env } from './utils/env';
import { isNetworkError } from './utils/errors';
import { isInteractive } from './utils/interactive';
import { Log } from './utils/log';
import { logNewSection } from './utils/ora';
import { endTimer, formatMilliseconds, startTimer } from './utils/timer';
import { ltSdkVersion } from './utils/versions';

interface DoctorCheckRunnerJob {
  check: DoctorCheck;
  result: DoctorCheckResult;
  duration: number;
  error?: Error;
}

/**
 * Return ORA for interactive prompt.
 * Print a simple log for non-interactive prompt and return a mock with a no-op stop function
 * to avoid ORA console clutter in EAS build logs and other non-interactive environments.
 */
function startSpinner(text: string): { stop(): void } {
  if (isInteractive()) {
    return logNewSection(text);
  }
  Log.log(text);
  return {
    stop() {},
  };
}

export async function printCheckResultSummaryOnComplete(job: DoctorCheckRunnerJob) {
  // These will log in order of completion, so they may change from run to run,
  // but outputting these just in time will make the EAS Build log timestamps for each line representative of the execution time.
  Log.log(
    `${job.result?.isSuccessful ? chalk.green('✔') : chalk.red('✖')} ${job.check.description}` +
      (env.EXPO_DEBUG ? ` (${formatMilliseconds(job.duration)})` : '')
  );
  // print unexpected errors inline with check completion
  if (job.error) {
    Log.error(`Unexpected error while running '${job.check.description}' check:`);
    Log.exception(job.error);
    const networkError = isNetworkError(job.error);
    if (networkError) {
      Log.error(`${job.error.cause}`);
      Log.error(
        'This check requires a connection to the Expo API. Please check your network connection.'
      );
      if (env.EXPO_DOCTOR_WARN_ON_NETWORK_ERRORS) {
        Log.warn(
          'EXPO_DOCTOR_WARN_ON_NETWORK_ERRORS is enabled. Ignoring network error for this check.'
        );
      }
    }
  }
}

export async function printFailedCheckIssueAndAdvice(job: DoctorCheckRunnerJob) {
  const result = job.result;

  // if the check was successful, don't print anything
  // if result is null, it failed due to an unexpected error (e.g., network failure, and the error should have already appeared)
  if (!result || result.isSuccessful) {
    return;
  }

  if (result.issues.length) {
    for (const issue of result.issues) {
      Log.warn(chalk.yellow(`${issue}`));
    }
    if (result.advice) {
      Log.log(chalk.green(`Advice: ${result.advice}`));
    }
    Log.log();
  }
}

/**
 * Run all commands in parallel. Make a callback as each one finishes.
 * @param checks list of checks to run (do any filtering beforehand)
 * @param checkParams parameters to be passed to each check
 * @param onCheckComplete callback to be called when each check finishes
 * @returns check with its associated results or exception if it failed unexpectedly
 */
export async function runChecksAsync(
  checks: DoctorCheck[],
  checkParams: DoctorCheckParams,
  onCheckComplete: (checkRunnerJob: DoctorCheckRunnerJob) => void
): Promise<DoctorCheckRunnerJob[]> {
  return await Promise.all(
    checks.map((check) =>
      (async function () {
        const job = { check } as DoctorCheckRunnerJob;
        try {
          startTimer(check.description);
          job.result = await check.runAsync(checkParams);
          job.duration = endTimer(check.description);
        } catch (e) {
          if (e instanceof Error) {
            job.error = e;
          }
          job.result = { isSuccessful: false } as DoctorCheckResult;
        }
        onCheckComplete(job);
        return job;
      })()
    )
  );
}

export async function actionAsync(projectRoot: string) {
  try {
    const projectConfig = getConfig(projectRoot);

    // expo-doctor relies on versioned CLI, which is only available for 44+
    if (ltSdkVersion(projectConfig.exp, '46.0.0')) {
      Log.exit(
        chalk.red(`expo-doctor supports Expo SDK 46+. Use 'expo-cli doctor' for SDK 45 and lower.`)
      );
      return;
    }

    const checksInScope = resolveChecksInScope(projectConfig.exp, projectConfig.pkg);

    const spinner = startSpinner(`Running ${checksInScope.length} checks on your project...`);

    const checkParams = { projectRoot, ...projectConfig };

    const jobs = await runChecksAsync(
      checksInScope,
      checkParams,
      printCheckResultSummaryOnComplete
    );

    spinner.stop();

    const failedJobs = jobs.filter((job) => !job.result.isSuccessful);

    if (failedJobs.length) {
      if (failedJobs.some((job) => job.result.issues?.length)) {
        Log.log();
        Log.log(chalk.underline('Detailed check results:'));
        Log.log();
        // actual issues will output in order of the sequence of tests, due to rules of Promise.all()
        failedJobs.forEach((job) => printFailedCheckIssueAndAdvice(job));
      }
      // check if all checks failed due to a network error if the flag to override network errors is enabled
      if (env.EXPO_DOCTOR_WARN_ON_NETWORK_ERRORS) {
        const failedJobsDueToNetworkError = failedJobs.filter((job) => isNetworkError(job.error));
        if (failedJobsDueToNetworkError.length === failedJobs.length) {
          Log.warn(
            'One or more checks failed due to network errors, but EXPO_DOCTOR_WARN_ON_NETWORK_ERRORS is enabled, so these errors will not fail Doctor. Run Doctor to retry these checks once the network is available.'
          );
          return;
        }
      }
      Log.exit(
        chalk.red('One or more checks failed, indicating possible issues with the project.')
      );
    } else {
      Log.log();
      Log.log(chalk.green(`Didn't find any issues with the project!`));
    }
  } catch (e: any) {
    Log.exception(e);
  }
}
