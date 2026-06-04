import { Command } from '@expo/commander';
import fs from 'fs-extra';
import path from 'path';

import {
  createGitHubSandboxSessionAsync,
  destroyGitHubSandboxSessionAsync,
  listGitHubSandboxLogEntriesAsync,
  postGitHubSandboxCommandAsync,
  waitForGitHubSandboxCommandResultAsync,
} from '../pr-sandbox/github-actions-session';

type ActionOptions = {
  prUrl?: string;
  repo?: string;
  pullNumber?: string;
  headSha?: string;
  controlIssue?: string;
  workflowFile?: string;
  workflowRef?: string;
  idleTimeout?: string;
  sessionId?: string;
  command?: string;
  cwd?: string;
  timeout?: string;
  network?: string;
  image?: string;
  resultTimeout?: string;
  pollInterval?: string;
  queueOnly?: boolean;
  output?: string;
};

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
      'Provide an action: create_session, run_command, get_logs, or destroy_session.'
    );
  }

  switch (actionName) {
    case 'create_session':
      await writeResultAsync(
        await createGitHubSandboxSessionAsync({
          prUrl: options.prUrl,
          repo: options.repo,
          pullNumber: options.pullNumber,
          headSha: options.headSha,
          controlIssue: options.controlIssue,
          workflowFile: options.workflowFile,
          workflowRef: options.workflowRef,
          idleTimeoutSeconds: options.idleTimeout,
        }),
        options.output
      );
      return;
    case 'run_command': {
      const command = await postGitHubSandboxCommandAsync({
        controlIssue: requireOption(options.controlIssue, '--control-issue'),
        sessionId: requireOption(options.sessionId, '--session-id'),
        command: requireOption(options.command, '--command'),
        cwd: options.cwd,
        timeout: options.timeout,
        network: options.network,
        image: options.image,
      });
      if (options.queueOnly) {
        await writeResultAsync(command, options.output);
        return;
      }
      await writeResultAsync(
        await waitForGitHubSandboxCommandResultAsync({
          controlIssue: requireOption(options.controlIssue, '--control-issue'),
          sessionId: command.sessionId,
          commandId: command.commandId,
          resultTimeoutMs: options.resultTimeout
            ? options.resultTimeout
            : String(command.timeout + 600_000),
          pollIntervalMs: options.pollInterval,
        }),
        options.output
      );
      return;
    }
    case 'get_logs':
      await writeResultAsync(
        await listGitHubSandboxLogEntriesAsync({
          controlIssue: requireOption(options.controlIssue, '--control-issue'),
          sessionId: requireOption(options.sessionId, '--session-id'),
        }),
        options.output
      );
      return;
    case 'destroy_session':
      await writeResultAsync(
        await destroyGitHubSandboxSessionAsync({
          controlIssue: requireOption(options.controlIssue, '--control-issue'),
          sessionId: requireOption(options.sessionId, '--session-id'),
        }),
        options.output
      );
      return;
    default:
      throw new Error(`Unsupported pr-sandbox-gh action "${actionName}".`);
  }
}

export default (program: Command) => {
  program
    .command('pr-sandbox-gh [action]')
    .description('Runs a GitHub Actions backed interactive PR sandbox session.')
    .option('--pr-url <url>', 'Public GitHub pull request URL for create_session.')
    .option('--repo <owner/name>', 'GitHub repository in owner/name format for create_session.')
    .option('--pull-number <number>', 'Pull request number for create_session.')
    .option('--head-sha <sha>', 'Exact PR head commit SHA for create_session.')
    .option('--control-issue <number>', 'expo/expo issue or PR number used as the command queue.')
    .option('--workflow-file <file>', 'Workflow filename. Defaults to pr-sandbox-session.yml.')
    .option('--workflow-ref <ref>', 'Branch or tag containing the workflow. Defaults to main.')
    .option('--idle-timeout <seconds>', 'Seconds before an idle session exits. Defaults to 1800.')
    .option('--session-id <id>', 'GitHub sandbox session ID.')
    .option('--command <command>', 'Command to run inside Docker for run_command.')
    .option('--cwd <path>', 'Repo-relative working directory for run_command.')
    .option('--timeout <ms>', 'Docker command timeout in milliseconds. Defaults to 300000.')
    .option(
      '--network <mode>',
      'Docker network mode for run_command: none, bridge, or default. Defaults to none.'
    )
    .option('--image <image>', 'Docker image for run_command. Defaults to node:22-bookworm.')
    .option(
      '--result-timeout <ms>',
      'Maximum time to wait for a result comment. Defaults to command timeout plus 600000.'
    )
    .option('--poll-interval <ms>', 'Result polling interval. Defaults to 5000.')
    .option('--queue-only', 'Queue run_command and return without waiting for the result.', false)
    .option('--output <path>', 'Optional JSON output path.')
    .asyncAction(action);
};
