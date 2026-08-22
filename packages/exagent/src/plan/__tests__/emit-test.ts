import { Log } from '../../log';
import type { StartPlan } from '../../project/types';
import { emitStartPlan } from '../emit';
import { event } from '../events';
import { formatStartPlan } from '../format';

jest.mock('../../log');
jest.mock('../events', () => ({ event: jest.fn(), debugEvent: jest.fn() }));

const plan: StartPlan = {
  target: 'expo-go',
  rule: 'expo-go',
  reasons: ['Expo Go can run this project.'],
  steps: [
    {
      id: 'start',
      argv: ['expo', 'start', '--go'],
      reason: 'Opens the project in Expo Go.',
      timeClass: 'seconds',
    },
  ],
};

describe(emitStartPlan, () => {
  it(`should emit the plan as a structured event before anything runs`, () => {
    emitStartPlan(plan, { mode: 'plan' });

    expect(event).toHaveBeenCalledWith('start_plan', {
      mode: 'plan',
      target: 'expo-go',
      rule: 'expo-go',
      steps: plan.steps,
      reasons: plan.reasons,
    });
  });

  it(`should print the plan table`, () => {
    emitStartPlan(plan, { mode: 'smart' });

    expect(Log.log).toHaveBeenCalledWith(formatStartPlan(plan));
  });

  it(`should report the mode of the run`, () => {
    emitStartPlan(plan, { mode: 'smart' });

    expect(event).toHaveBeenCalledWith('start_plan', expect.objectContaining({ mode: 'smart' }));
  });

  it(`should print the plan as JSON and nothing else`, () => {
    emitStartPlan(plan, { mode: 'plan', json: true });

    expect(Log.log).toHaveBeenCalledTimes(1);
    expect(Log.log).toHaveBeenCalledWith(JSON.stringify(plan, null, 2));
    expect(JSON.parse(jest.mocked(Log.log).mock.calls[0]![0]!)).toEqual(plan);
  });

  // Shape test: the top-level keys of `--json` are the command's contract, so they are asserted
  // as an exact set. Adding, renaming, or dropping one is a breaking change for every caller.
  it(`should print a stable set of top-level keys with --json`, () => {
    emitStartPlan(plan, { mode: 'plan', json: true });

    const printed = JSON.parse(jest.mocked(Log.log).mock.calls[0]![0]!);
    expect(Object.keys(printed).sort()).toEqual(['reasons', 'rule', 'steps', 'target']);
  });

  it(`should still emit the event in JSON mode`, () => {
    emitStartPlan(plan, { mode: 'plan', json: true });

    expect(event).toHaveBeenCalledWith('start_plan', expect.objectContaining({ rule: 'expo-go' }));
  });
});
