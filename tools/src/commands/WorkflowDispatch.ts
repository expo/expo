import { Command } from '@expo/commander';
import chalk from 'chalk';
import inquirer from 'inquirer';
import open from 'open';

import Git from '../Git';
import {
  getWorkflowsAsync,
  dispatchWorkflowEventAsync,
  getLatestDispatchedWorkflowRunAsync,
  Workflow,
  getJobsForWorkflowRunAsync,
} from '../GitHubActions';
import logger from '../Logger';
import { deepCloneObject, retryAsync } from '../Utils';

type CommandOptions = {
  ref?: string;
  open?: boolean;
};

// Object containing configs for custom workflows.
// Custom workflows extends common workflows by providing specific inputs.
const CUSTOM_WORKFLOWS = {
  'client-android-eas-release': {
    name: 'Android Expo Go Release',
    baseWorkflowSlug: 'client-android-eas',
  },
  'sdk-all': {
    name: 'SDK All',
    baseWorkflowSlug: 'sdk',
    inputs: {
      checkAll: 'check-all',
    },
  },
};

export default (program: Command) => {
  program
    .command('workflow-dispatch [workflowSlug]')
    .alias('dispatch', 'wd')
    .option(
      '-r, --ref <ref>',
      'The reference of the workflow run. The reference can be a branch, tag, or a commit SHA.'
    )
    .option(
      '--no-open',
      "Whether not to automatically open a page with workflow's job run containing the one that has just been triggered.",
      false
    )
    .description(
      `Dispatches an event that triggers a workflow on GitHub Actions. Requires ${chalk.magenta(
        'GITHUB_TOKEN'
      )} env variable to be set.`
    )
    .asyncAction(main);
};

/**
 * Main action of the command.
 */
async function main(workflowSlug: string | undefined, options: CommandOptions) {
  if (!process.env.GITHUB_TOKEN) {
    throw new Error('Environment variable `GITHUB_TOKEN` must be set.');
  }

  const workflows = await getAllWorkflowsAsync();
  const workflow = await findWorkflowAsync(workflows, workflowSlug);
  const ref = options.ref || (await Git.getCurrentBranchNameAsync());

  if (!workflow) {
    throw new Error(`Unable to find workflow with slug \`${workflowSlug}\`.`);
  }

  // We need a confirmation to trigger a custom workflow.
  if (!process.env.CI && workflow.inputs && !(await confirmTriggeringWorkflowAsync(workflow))) {
    logger.warn(
      `\n⚠️  Triggering custom workflow ${chalk.green(workflow.slug)} has been canceled.`
    );
    return;
  }

  // Get previously dispatched workflow run.
  const previousWorkflowRun = await getLatestDispatchedWorkflowRunAsync(workflow.id);

  // Dispatch `workflow_dispatch` event.
  await dispatchWorkflowEventAsync(workflow.id, ref, workflow.inputs);

  logger.success('🎉 Successfully dispatched workflow event ');

  // Let's wait a little bit for the new workflow run to start and appear in the API response.
  logger.info('⏳ Waiting for the new workflow run to start...');
  const newWorkflowRun = await retryAsync(2000, 10, async () => {
    const run = await getLatestDispatchedWorkflowRunAsync(workflow.id);

    // Compare the result with previous workflow run.
    return previousWorkflowRun?.id !== run?.id ? run : undefined;
  });

  // Get a list of jobs for the new workflow run.
  const jobs = newWorkflowRun && (await getJobsForWorkflowRunAsync(newWorkflowRun.id));

  // If the job exists, open it in web browser or print the link.
  if (jobs?.[0]) {
    const url = jobs[0].html_url;

    if (url) {
      if (options.open && !process.env.CI) {
        await open(url);
      }
      logger.log(`🧭 You can open ${chalk.magenta(url)} to track the new workflow run.`);
    } else {
      logger.warn(`⚠️  Cannot get URL for job: `, jobs[0]);
    }
  } else {
    logger.warn(`⚠️  Cannot find any triggered jobs for ${chalk.green(workflow.slug)} workflow`);
  }
}

/**
 * Resolves to an array of workflows containing workflows fetched from the API
 * concatenated with custom workflows that declares some specific inputs.
 */
async function getAllWorkflowsAsync(): Promise<Workflow[]> {
  // Fetch workflows from GitHub Actions API.
  const commonWorkflows = await getWorkflowsAsync();

  // Map custom workflow configs to workflows.
  const customWorkflows = Object.entries(CUSTOM_WORKFLOWS)
    .map(([customWorkflowSlug, workflowConfig]) => {
      const baseWorkflow = commonWorkflows.find(
        (workflow) => workflow.slug === workflowConfig.baseWorkflowSlug
      );

      return baseWorkflow
        ? {
            ...deepCloneObject(baseWorkflow),
            name: workflowConfig.name,
            slug: customWorkflowSlug,
            baseSlug: workflowConfig.baseWorkflowSlug,
            inputs: workflowConfig.inputs,
          }
        : null;
    })
    .filter(Boolean) as Workflow[];

  const allWorkflows = ([] as Workflow[]).concat(commonWorkflows, customWorkflows);
  return allWorkflows.sort((a, b) => a.name.localeCompare(b.name));
}

/**
 * Finds workflow ID based on given name or config filename.
 */
async function findWorkflowAsync(
  workflows: Workflow[],
  workflowSlug: string | undefined
): Promise<Workflow | null> {
  if (!workflowSlug) {
    if (process.env.CI) {
      throw new Error('Command requires `workflowName` argument when run on the CI.');
    }
    return await promptWorkflowAsync(workflows);
  }
  return workflows.find((workflow) => workflow.slug === workflowSlug) ?? null;
}

/**
 * Prompts for the workflow to trigger.
 */
async function promptWorkflowAsync(workflows: Workflow[]): Promise<Workflow> {
  const { workflow } = await inquirer.prompt([
    {
      type: 'list',
      name: 'workflow',
      message: 'Which workflow do you want to dispatch?',
      choices: workflows.map((workflow) => {
        return {
          name: `${chalk.yellow(workflow.name)} (${chalk.green.italic(workflow.slug)})`,
          value: workflow,
        };
      }),
      pageSize: workflows.length,
    },
  ]);
  return workflow;
}

/**
 * Requires the user to confirm dispatching an event that trigger given workflow.
 */
async function confirmTriggeringWorkflowAsync(workflow: Workflow): Promise<boolean> {
  logger.info(
    `\n👉 I'll trigger ${chalk.green(workflow.baseSlug)} workflow extended by the following input:`
  );
  logger.log(workflow.inputs, '\n');

  const { confirm } = await inquirer.prompt([
    {
      type: 'confirm',
      name: 'confirm',
      message: 'Please type `y` and press enter if you want to continue',
      default: false,
    },
  ]);
  return confirm;
}
