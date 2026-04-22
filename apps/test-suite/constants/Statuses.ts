const Statuses = {
  Running: 'running',
  Passed: 'passed',
  Failed: 'failed',
  Disabled: 'disabled',
  Pending: 'pending',
  Excluded: 'excluded',
} as const;

export type Status = (typeof Statuses)[keyof typeof Statuses];

export default Statuses;
