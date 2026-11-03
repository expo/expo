import { updateEventLoggerMetadata } from '2g';
import path from 'path';

import { updateProjectRootMetadata } from '../metadata';

jest.mock('2g', () => ({ updateEventLoggerMetadata: jest.fn() }));

it('omits the project root when it matches cwd', () => {
  updateProjectRootMetadata('.');
  expect(updateEventLoggerMetadata).not.toHaveBeenCalled();
});

it.each(['apps/mobile', '..'])('records a distinct resolved project root: %s', (root) => {
  updateProjectRootMetadata(root);
  expect(updateEventLoggerMetadata).toHaveBeenCalledWith({ projectRoot: path.resolve(root) });
});
