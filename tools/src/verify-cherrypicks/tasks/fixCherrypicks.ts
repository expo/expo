import { Task } from '../../TasksRunner';
import { TaskArgs } from '../types';
import { checkRepositoryStatus } from './checkRepositoryStatus';
import { verifyCherrypicks } from './verifyCherrypicks';

/**
 * //TODO: Add description.
 */
export const fixCherrypicks = new Task<TaskArgs>(
  {
    name: 'fixCherrypicks',
    dependsOn: [verifyCherrypicks, checkRepositoryStatus],
  },
  async (state, options) => {}
);
