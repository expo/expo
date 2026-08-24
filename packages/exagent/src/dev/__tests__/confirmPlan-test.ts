import { Log } from '../../log';
import type { PlanStep, StartPlan, TimeClass } from '../../project/types';
import { isInteractive } from '../../utils/interactive';
import { confirmAsync } from '../../utils/prompts';
import { confirmPlanAsync } from '../confirmPlan';
import { resolveDevOptions } from '../resolveOptions';

jest.mock('../../log');
jest.mock('../../plan/events', () => ({ event: jest.fn(), debugEvent: jest.fn() }));
jest.mock('../../utils/interactive', () => ({ isInteractive: jest.fn(() => true) }));
jest.mock('../../utils/prompts', () => ({ confirmAsync: jest.fn() }));

/** A plan of one step of the given cost. */
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

beforeEach(() => {
  jest.mocked(isInteractive).mockReturnValue(true);
  jest.mocked(confirmAsync).mockResolvedValue(true);
});

afterEach(() => {
  jest.resetAllMocks();
});

describe(confirmPlanAsync, () => {
  it(`should ask before running a plan that builds`, async () => {
    await expect(confirmPlanAsync(mockPlan('a-minute', 'many-minutes'), options())).resolves.toBe(
      true
    );

    expect(confirmAsync).toHaveBeenCalledWith({ message: 'Run this plan?' });
  });

  it(`should report a declined plan and explain what to run instead`, async () => {
    jest.mocked(confirmAsync).mockResolvedValue(false);

    await expect(confirmPlanAsync(mockPlan('many-minutes'), options())).resolves.toBe(false);

    const printed = jest.mocked(Log.log).mock.calls.flat().join('\n');
    expect(printed).toContain('npx exagent dev --plan');
    expect(printed).toContain('npx exagent start');
  });

  it(`should treat a cancelled prompt as a decline`, async () => {
    // `confirmAsync` answers `null` when the prompt was answered with nothing at all.
    jest.mocked(confirmAsync).mockResolvedValue(null as unknown as boolean);

    await expect(confirmPlanAsync(mockPlan('many-minutes'), options())).resolves.toBe(false);
  });

  it(`should not ask about a plan that only starts the dev server`, async () => {
    await expect(confirmPlanAsync(mockPlan('seconds'), options())).resolves.toBe(true);

    expect(confirmAsync).not.toHaveBeenCalled();
  });

  it(`should not ask when the terminal is not interactive`, async () => {
    jest.mocked(isInteractive).mockReturnValue(false);

    await expect(confirmPlanAsync(mockPlan('many-minutes'), options())).resolves.toBe(true);

    expect(confirmAsync).not.toHaveBeenCalled();
  });

  it(`should not ask with --yes`, async () => {
    await expect(confirmPlanAsync(mockPlan('many-minutes'), options('--yes'))).resolves.toBe(true);

    expect(confirmAsync).not.toHaveBeenCalled();
  });

  it(`should not ask with --json, whose stdout is parsed`, async () => {
    await expect(confirmPlanAsync(mockPlan('many-minutes'), options('--json'))).resolves.toBe(true);

    expect(confirmAsync).not.toHaveBeenCalled();
  });

  it.each(['a-minute', 'minutes', 'many-minutes'] as TimeClass[])(
    `should ask about a %s step`,
    async (timeClass) => {
      await confirmPlanAsync(mockPlan('seconds', timeClass), options());

      expect(confirmAsync).toHaveBeenCalled();
    }
  );
});

function options(...argv: string[]) {
  return resolveDevOptions(argv);
}
