import { event } from '../../events';
import * as Log from '../../log';
import { resetInvokerCache } from '../../utils/invoker';
import { formatFollowUps } from '../format';
import { followUpsEnabled, reportFollowUps } from '../report';
import type { FollowUp } from '../types';

jest.mock('../../log');
jest.mock('../../events', () => ({ event: jest.fn(), debugEvent: jest.fn() }));

const followups: FollowUp[] = [
  { id: 'runtime-errors', command: 'npx exagent runtime:errors', why: 'Reads the app errors.' },
  { id: 'eas-build', command: 'npx eas build', why: 'Ships the app.' },
];

afterEach(() => {
  delete process.env.EXAGENT_NO_FOLLOWUPS;
});

describe(followUpsEnabled, () => {
  it(`should be on by default`, () => {
    expect(followUpsEnabled(undefined)).toBe(true);
    expect(followUpsEnabled(true)).toBe(true);
  });

  it(`should be off for --no-followups`, () => {
    expect(followUpsEnabled(false)).toBe(false);
  });

  it(`should be off for EXAGENT_NO_FOLLOWUPS`, () => {
    process.env.EXAGENT_NO_FOLLOWUPS = '1';

    expect(followUpsEnabled(true)).toBe(false);
    expect(followUpsEnabled(undefined)).toBe(false);
  });
});

describe(reportFollowUps, () => {
  it(`should emit one event and print the Next section`, () => {
    expect(reportFollowUps('start', followups)).toEqual(followups);

    expect(event).toHaveBeenCalledTimes(1);
    expect(event).toHaveBeenCalledWith('followups', { command: 'start', followups });
    expect(Log.log).toHaveBeenCalledWith(formatFollowUps(followups));
  });

  it(`should emit the event but print nothing in JSON mode`, () => {
    reportFollowUps('status', followups, { json: true });

    expect(event).toHaveBeenCalledWith('followups', { command: 'status', followups });
    expect(Log.log).not.toHaveBeenCalled();
  });

  it(`should emit the event without printing when the command carries its own next line`, () => {
    reportFollowUps('status', followups, { silent: true });

    expect(event).toHaveBeenCalledTimes(1);
    expect(Log.log).not.toHaveBeenCalled();
  });

  it(`should do nothing at all for an empty list`, () => {
    expect(reportFollowUps('start', [])).toEqual([]);

    expect(event).not.toHaveBeenCalled();
    expect(Log.log).not.toHaveBeenCalled();
  });

  it(`should cap the list at three, keeping the most relevant first`, () => {
    const many: FollowUp[] = [1, 2, 3, 4, 5].map((index) => ({
      id: `id-${index}`,
      command: `command ${index}`,
      why: 'why',
    }));

    const reported = reportFollowUps('start', many);

    expect(reported.map((followup) => followup.id)).toEqual(['id-1', 'id-2', 'id-3']);
    expect(event).toHaveBeenCalledWith('followups', {
      command: 'start',
      followups: reported,
    });
  });
});

describe(formatFollowUps, () => {
  it(`should render a Next section with one line per follow-up`, () => {
    const lines = formatFollowUps(followups).split('\n');

    // The section trails whatever the command printed, so it opens with a blank line.
    expect(lines[0]).toBe('');
    expect(lines[1]).toContain('Suggested next:');
    expect(lines[2]).toContain('npx exagent runtime:errors');
    expect(lines[2]).toContain('— Reads the app errors.');
    expect(lines[3]).toContain('npx eas build');
  });

  it(`should align the commands into one column`, () => {
    const lines = formatFollowUps(followups).split('\n');

    expect(lines[2]!.indexOf('—')).toBe(lines[3]!.indexOf('—'));
  });

  it(`should render nothing for an empty list`, () => {
    expect(formatFollowUps([])).toBe('');
  });
});

// @ref llp/0010-agent-conventions.rfc.md §Suggestions are pasted, so they have to be runnable
describe(`${formatFollowUps.name} — the runner in use`, () => {
  afterEach(() => {
    delete process.env.npm_config_user_agent;
    resetInvokerCache();
  });

  it(`spells this CLI the way a Bun project runs it, and leaves other CLIs alone`, () => {
    process.env.npm_config_user_agent = 'bun/1.3.14 npm/? node/v24.3.0 darwin arm64';
    resetInvokerCache();

    const printed = formatFollowUps(followups);

    expect(printed).toContain('bunx exagent runtime:errors');
    expect(printed).not.toContain('npx exagent');
    // `npx eas` names a different package under Bun, so it is not this substitution's to change.
    expect(printed).toContain('npx eas build');
  });

  // The machine channel does not move with the shell: `npx exagent` runs in a Bun project too, and
  // the `--json` payload is a contract rather than a line somebody pastes.
  it(`leaves the follow-up objects themselves unchanged`, () => {
    process.env.npm_config_user_agent = 'bun/1.3.14 npm/? node/v24.3.0 darwin arm64';
    resetInvokerCache();

    formatFollowUps(followups);

    expect(followups[0]!.command).toBe('npx exagent runtime:errors');
  });

  it(`prints the written form under npx`, () => {
    process.env.npm_config_user_agent = 'npm/11.17.0 node/v26.5.0 darwin arm64';
    resetInvokerCache();

    expect(formatFollowUps(followups)).toContain('npx exagent runtime:errors');
  });
});
