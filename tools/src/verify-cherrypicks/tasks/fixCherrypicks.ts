import { Task } from '../../TasksRunner';
import { TaskArgs } from '../types';
import { checkRepositoryStatus } from './checkRepositoryStatus';
import { fixCherrypicksContinue } from './fixCherrypicksContinue';

/**
 * Performs fix cherrypicks with additional repository status check.
 */
export const fixCherrypicks = new Task<TaskArgs>(
  {
    name: 'fixCherrypicks',
    dependsOn: [checkRepositoryStatus, fixCherrypicksContinue],
  },
  async () => {}
);
