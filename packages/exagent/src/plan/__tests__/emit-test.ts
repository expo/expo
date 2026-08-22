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
    expect(JSON.parse(jest.mocked(Log.log).mock.calls[0]![0]!)).toEqual({
      ...plan,
      followups: [],
    });
  });

  // Shape test: the top-level keys of `--json` are the command's contract, so they are asserted
  // as an exact set. Adding, renaming, or dropping one is a breaking change for every caller.
  // `followups` joined the set with llp/0009; it is always present, and empty when suppressed.
  it(`should print a stable set of top-level keys with --json`, () => {
    emitStartPlan(plan, { mode: 'plan', json: true });

    const printed = JSON.parse(jest.mocked(Log.log).mock.calls[0]![0]!);
    expect(Object.keys(printed).sort()).toEqual([
      'followups',
      'reasons',
      'rule',
      'steps',
      'target',
    ]);
  });

  // @ref llp/0009-smart-followups.rfc.md §Design — "also embedded in `--json` payloads".
  it(`should embed the follow-ups in the JSON plan`, () => {
    const followups = [
      { id: 'start-smart', command: 'npx exagent start --smart', why: 'Runs the plan.' },
    ];

    emitStartPlan(plan, { mode: 'plan', json: true, followups });

    expect(JSON.parse(jest.mocked(Log.log).mock.calls[0]![0]!).followups).toEqual(followups);
  });

  it(`should keep the follow-ups out of the plan table, which the caller prints itself`, () => {
    emitStartPlan(plan, {
      mode: 'plan',
      followups: [{ id: 'start-smart', command: 'npx exagent start --smart', why: 'Runs it.' }],
    });

    expect(Log.log).toHaveBeenCalledTimes(1);
    expect(Log.log).toHaveBeenCalledWith(formatStartPlan(plan));
  });

  it(`should print an empty follow-up list when none is passed`, () => {
    emitStartPlan(plan, { mode: 'smart', json: true });

    expect(JSON.parse(jest.mocked(Log.log).mock.calls[0]![0]!).followups).toEqual([]);
  });

  it(`should still emit the event in JSON mode`, () => {
    emitStartPlan(plan, { mode: 'plan', json: true });

    expect(event).toHaveBeenCalledWith('start_plan', expect.objectContaining({ rule: 'expo-go' }));
  });
});
