import { getConfig } from '@expo/config';
import chalk from 'chalk';
import semver from 'semver';

import { DirectPackageInstallCheck } from './checks/DirectPackageInstallCheck';
import { ExpoConfigCommonIssueCheck } from './checks/ExpoConfigCommonIssueCheck';
import { ExpoConfigSchemaCheck } from './checks/ExpoConfigSchemaCheck';
import { GlobalPackageInstalledCheck } from './checks/GlobalPackageInstalledCheck';
import { GlobalPrereqsVersionCheck } from './checks/GlobalPrereqsVersionCheck';
import { IllegalPackageCheck } from './checks/IllegalPackageCheck';
import { InstalledDependencyVersionCheck } from './checks/InstalledDependencyVersionCheck';
import { PackageJsonCheck } from './checks/PackageJsonCheck';
import { ProjectSetupCheck } from './checks/ProjectSetupCheck';
import { SupportPackageVersionCheck } from './checks/SupportPackageVersionCheck';
import { DoctorCheck, DoctorCheckParams, DoctorCheckResult } from './checks/checks.types';
import { env } from './utils/env';
import { isInteractive } from './utils/interactive';
import { Log } from './utils/log';
import { logNewSection } from './utils/ora';
import { endTimer, formatMilliseconds, startTimer } from './utils/timer';
import { ltSdkVersion } from './utils/versions';
import { warnUponCmdExe } from './warnings/windows';

type CheckError = Error & { code?: string };

interface DoctorCheckRunnerJob {
  check: DoctorCheck;
  result: DoctorCheckResult;
  duration: number;
  error?: CheckError;
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
    Log.exception(job.error!);
    if (job.error?.code === 'ENOTFOUND') {
      Log.error(
        'This check requires a connection to the Expo API. Please check your network connection.'
      );
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
    checks.map(check =>
      (async function () {
        const job = { check } as DoctorCheckRunnerJob;
        try {
          startTimer(check.description);
          job.result = await check.runAsync(checkParams);
          job.duration = endTimer(check.description);
        } catch (e: any) {
          job.error = e;
          job.result = { isSuccessful: false } as DoctorCheckResult;
        }
        onCheckComplete(job);
        return job;
      })()
    )
  );
}

export async function actionAsync(projectRoot: string) {
  await warnUponCmdExe();

  const { exp, pkg } = getConfig(projectRoot);

  // expo-doctor relies on versioned CLI, which is only available for 44+
  try {
    if (ltSdkVersion(exp, '46.0.0')) {
      Log.exit(
        chalk.red(`expo-doctor supports Expo SDK 46+. Use 'expo-cli doctor' for SDK 45 and lower.`)
      );
      return;
    }
  } catch (e: any) {
    Log.exit(e);
    return;
  }

  // add additional checks here
  const checks = [
    new GlobalPrereqsVersionCheck(),
    new IllegalPackageCheck(),
    new GlobalPackageInstalledCheck(),
    new SupportPackageVersionCheck(),
    new InstalledDependencyVersionCheck(),
    new ExpoConfigSchemaCheck(),
    new ExpoConfigCommonIssueCheck(),
    new DirectPackageInstallCheck(),
    new PackageJsonCheck(),
    new ProjectSetupCheck(),
  ];

  const checkParams = { exp, pkg, projectRoot };

  const filteredChecks = checks.filter(
    check =>
      checkParams.exp.sdkVersion === 'UNVERSIONED' ||
      semver.satisfies(checkParams.exp.sdkVersion!, check.sdkVersionRange)
  );

  const spinner = startSpinner(`Running ${filteredChecks.length} checks on your project...`);

  const jobs = await runChecksAsync(filteredChecks, checkParams, printCheckResultSummaryOnComplete);

  spinner.stop();

  if (jobs.some(job => !job.result.isSuccessful)) {
    if (jobs.some(job => job.result.issues?.length)) {
      Log.log();
      Log.log(chalk.underline('Detailed check results:'));
      Log.log();
      // actual issues will output in order of the sequence of tests, due to rules of Promise.all()
      jobs.forEach(job => printFailedCheckIssueAndAdvice(job));
    }
    Log.exit(chalk.red('One or more checks failed, indicating possible issues with the project.'));
  } else {
    Log.log();
    Log.log(chalk.green(`Didn't find any issues with the project!`));
  }
}
