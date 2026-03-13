import chalk from 'chalk';

import { addIssueLabelsAsync, removeIssueLabelAsync } from '../../GitHub';
import logger from '../../Logger';
import { Task } from '../../TasksRunner';
import { TaskArgs } from '../types';
import { getPullRequests } from './getPullRequests';
import { updateState } from './updateState';

const { green, red } = chalk;

/**
 * Fixes labels on all PRs that are already cherry-picked.
 */
export const fixLabels = new Task<TaskArgs>(
  {
    name: 'fixLabels',
    dependsOn: [getPullRequests, updateState],
  },
  async (state, options) => {
    const toUpdateLabel = [...state.pullRequests.toUpdateLabel];

    if (toUpdateLabel.length === 0) {
      logger.info('\n✅ Did not found any PRs that needs label updates.');
      return;
    }

    logger.info(`\nUpdating ${toUpdateLabel.length} labels...`);

    for (const pr of toUpdateLabel) {
      logger.log(`    Updating #${pr.number} (${pr.title}) labels:`);
      if (!options.dry) {
        await removeIssueLabelAsync(pr.number, pr.label.name);
      }
      logger.debug(`        ${red('-')} ${pr.label.name}`);
      if (!options.dry) {
        await addIssueLabelsAsync(pr.number, [`${pr.label.name} cherry-picked`]);
      }
      logger.debug(`        ${green('+')} ${pr.label.name} cherry-picked`);
    }
  }
);
