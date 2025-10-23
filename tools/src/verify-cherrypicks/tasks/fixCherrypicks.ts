import { Task } from '../../TasksRunner';
import { TaskArgs } from '../types';
import { checkRepositoryStatus } from './checkRepositoryStatus';
import { fixCherrypicksContinue } from './fixCherrypicksContinue';
import { pushSdkBranches } from './pushSdkBranches';

/**
 * Performs fix cherrypicks with additional repository status check.
 */
export const fixCherrypicks = new Task<TaskArgs>(
  {
    name: 'fixCherrypicks',
    dependsOn: [checkRepositoryStatus, fixCherrypicksContinue, pushSdkBranches],
  },
  async () => {}
);
