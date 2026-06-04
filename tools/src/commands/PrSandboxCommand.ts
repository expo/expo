import { Command } from '@expo/commander';
import fs from 'fs-extra';
import path from 'path';

import { PrSandboxClient } from '../pr-sandbox/client';
import { collectSandboxEvidenceAsync } from '../pr-sandbox/evidence';
import { fetchPublicPullRequestRefAsync } from '../pr-sandbox/github';
import type { PrSandboxJobRequest } from '../pr-sandbox/types';
import { normalizePullRequestRef } from '../pr-sandbox/validation';

type ActionOptions = {
  workerUrl?: string;
  authToken?: string;
  prUrl?: string;
  repo?: string;
  pullNumber?: string;
  headSha?: string;
  jobId?: string;
  preset?: string;
  path?: string;
  output?: string;
  logLimit?: string;
  destroyJob?: boolean;
};

function createClient(options: ActionOptions): PrSandboxClient {
  const workerUrl = options.workerUrl ?? process.env.PR_SANDBOX_WORKER_URL;
  if (!workerUrl) {
    throw new Error('Provide --worker-url or set PR_SANDBOX_WORKER_URL.');
  }
  return new PrSandboxClient({
    workerUrl,
    authToken: options.authToken ?? process.env.PR_SANDBOX_AUTH_TOKEN,
  });
}

async function resolvePullRequestRefAsync(options: ActionOptions): Promise<PrSandboxJobRequest> {
  if (options.prUrl && !options.headSha) {
    return await fetchPublicPullRequestRefAsync(options.prUrl);
  }
  if (!options.headSha) {
    throw new Error('Provide --head-sha, or provide --pr-url so it can be fetched.');
  }
  return normalizePullRequestRef({
    prUrl: options.prUrl,
    repo: options.repo,
    pullNumber: options.pullNumber,
    headSha: options.headSha,
  });
}

async function writeResultAsync(result: unknown, output?: string) {
  if (output) {
    await fs.outputJson(path.resolve(output), result, { spaces: 2 });
  } else {
    console.log(JSON.stringify(result, null, 2));
  }
}

function requireOption(value: string | undefined, name: string): string {
  if (!value) {
    throw new Error(`Provide ${name}.`);
  }
  return value;
}

async function action(actionName: string | undefined, options: ActionOptions) {
  if (!actionName) {
    throw new Error(
      'Provide an action: create_pr_job, run_preset, get_logs, read_file, destroy_job, or collect_evidence.'
    );
  }

  const client = createClient(options);
  switch (actionName) {
    case 'create_pr_job': {
      const ref = await resolvePullRequestRefAsync(options);
      await writeResultAsync(await client.createPrJobAsync(ref), options.output);
      return;
    }
    case 'run_preset':
      await writeResultAsync(
        await client.runPresetAsync(
          requireOption(options.jobId, '--job-id'),
          requireOption(options.preset, '--preset')
        ),
        options.output
      );
      return;
    case 'get_logs':
      await writeResultAsync(
        await client.getLogsAsync(requireOption(options.jobId, '--job-id')),
        options.output
      );
      return;
    case 'read_file':
      await writeResultAsync(
        await client.readFileAsync(
          requireOption(options.jobId, '--job-id'),
          requireOption(options.path, '--path')
        ),
        options.output
      );
      return;
    case 'destroy_job':
      await writeResultAsync(
        await client.destroyJobAsync(requireOption(options.jobId, '--job-id')),
        options.output
      );
      return;
    case 'collect_evidence': {
      const logLimit = options.logLimit == null ? undefined : Number(options.logLimit);
      if (logLimit != null && (!Number.isInteger(logLimit) || logLimit <= 0)) {
        throw new Error('--log-limit must be a positive integer.');
      }
      const report = await collectSandboxEvidenceAsync({
        prUrl: requireOption(options.prUrl, '--pr-url'),
        client,
        logLimit,
        destroyJob: !!options.destroyJob,
      });
      await writeResultAsync(report, options.output);
      return;
    }
    default:
      throw new Error(`Unsupported pr-sandbox action "${actionName}".`);
  }
}

export default (program: Command) => {
  program
    .command('pr-sandbox [action]')
    .description('Runs narrow Cloudflare Sandbox evidence actions for external PR review.')
    .option('--worker-url <url>', 'Cloudflare Worker URL. Defaults to PR_SANDBOX_WORKER_URL.')
    .option('--auth-token <token>', 'Worker bearer token. Defaults to PR_SANDBOX_AUTH_TOKEN.')
    .option('--pr-url <url>', 'Public GitHub pull request URL.')
    .option('--repo <owner/name>', 'GitHub repository in owner/name format.')
    .option('--pull-number <number>', 'Pull request number.')
    .option('--head-sha <sha>', 'Exact PR head commit SHA.')
    .option('--job-id <id>', 'Sandbox job ID.')
    .option('--preset <name>', 'Sandbox preset to run.')
    .option('--path <path>', 'Relative repository path for read_file.')
    .option('--output <path>', 'Optional JSON output path.')
    .option('--log-limit <number>', 'Maximum returned log characters for collect_evidence.')
    .option('--destroy-job', 'Destroy the sandbox job after collect_evidence completes.', false)
    .asyncAction(action);
};
