import { Log } from '../../log';
import { event } from '../../plan/events';
import type { PlanStep, StartPlan, TimeClass } from '../../project/types';
import { isInteractive } from '../../utils/interactive';
import { hasPlanConsent } from '../planConsent';
import { resolveDevOptions } from '../resolveOptions';

jest.mock('../../log');
jest.mock('../../plan/events', () => ({ event: jest.fn(), debugEvent: jest.fn() }));
jest.mock('../../utils/interactive', () => ({ isInteractive: jest.fn(() => true) }));

/** A plan of one step per given cost. */
function mockPlan(...timeClasses: TimeClass[]): StartPlan {
  const steps: PlanStep[] = timeClasses.map((timeClass, index) => ({
    id: `step-${index}`,
    argv: ['expo', 'start'],
    reason: 'because',
    timeClass,
    runsOn: null,
  }));
  return {
    target: 'dev-client',
    rule: 'dev-client-stale',
    steps,
    reasons: [],
    buildLocation: null,
  };
}

/** Everything `Log.log` was given, as one string. */
function printed(): string {
  return jest.mocked(Log.log).mock.calls.flat().join('\n');
}

/** A `process.argv`: the node binary, the script, then what was typed. */
function argv(...typed: string[]): string[] {
  return ['/usr/bin/node', '/tmp/cli/bin/cli.js', ...typed];
}

function options(...argv: string[]) {
  return resolveDevOptions(argv);
}

beforeEach(() => {
  jest.mocked(isInteractive).mockReturnValue(true);
});

afterEach(() => {
  jest.resetAllMocks();
});

describe(hasPlanConsent, () => {
  it(`stops a plan that builds, and asks nothing`, () => {
    expect(hasPlanConsent(mockPlan('a-minute', 'many-minutes'), options(), argv('dev'))).toBe(false);

    // The wave in one assertion: no question, so nothing is waiting on an answer.
    expect(printed()).not.toContain('?');
  });

  it(`leads with the fact that nothing ran, before anything else it says`, () => {
    hasPlanConsent(mockPlan('many-minutes'), options(), argv('dev'));

    expect(printed().split('\n')[0]).toContain('Nothing ran');
  });

  it(`hands back the caller's own command, with the flags they typed`, () => {
    hasPlanConsent(mockPlan('many-minutes'), options('--ios'), argv('dev', '--ios'));

    expect(printed()).toContain('Run it: npx @expo/agent-cli dev --ios --yes');
  });

  it(`emits the stop as an event, carrying the command that resumes it`, () => {
    hasPlanConsent(mockPlan('many-minutes'), options('--ios'), argv('dev', '--ios'));

    expect(event).toHaveBeenCalledWith('start_plan_needs_consent', {
      rule: 'dev-client-stale',
      steps: 1,
      rerun: 'npx @expo/agent-cli dev --ios --yes',
    });
  });

  it(`runs a plan that only starts the dev server`, () => {
    expect(hasPlanConsent(mockPlan('seconds'), options(), argv('dev'))).toBe(true);

    expect(printed()).toBe('');
    expect(event).not.toHaveBeenCalled();
  });

  it(`runs the plan the caller already said yes to`, () => {
    expect(hasPlanConsent(mockPlan('many-minutes'), options('--yes'), argv('dev', '--yes'))).toBe(
      true
    );

    expect(printed()).toBe('');
  });

  it(`runs a plan in --json mode, whose caller is a machine that asked for the work`, () => {
    expect(hasPlanConsent(mockPlan('many-minutes'), options('--json'), argv('dev', '--json'))).toBe(
      true
    );

    expect(printed()).toBe('');
  });

  it(`runs a plan with no terminal watching, which is the agent's own path`, () => {
    jest.mocked(isInteractive).mockReturnValue(false);

    expect(hasPlanConsent(mockPlan('many-minutes'), options(), argv('dev'))).toBe(true);

    expect(printed()).toBe('');
  });

  it.each(['a-minute', 'minutes', 'many-minutes'] as TimeClass[])(
    `stops on a %s step`,
    (timeClass) => {
      expect(hasPlanConsent(mockPlan('seconds', timeClass), options(), argv('dev'))).toBe(false);
    }
  );
});
