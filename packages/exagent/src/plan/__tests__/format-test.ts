import type { StartPlan } from '../../project/types';
import { formatStartPlan, formatTimeClass } from '../format';

const plan: StartPlan = {
  target: 'dev-client',
  rule: 'dev-client-stale',
  reasons: ['Expo SDK 54.0.0.', 'expo-dev-client is a dependency.'],
  steps: [
    {
      id: 'prebuild',
      argv: ['expo', 'prebuild', '--platform', 'ios'],
      reason: 'Generates the ios project from the app config.',
      timeClass: 'a-minute',
    },
    {
      id: 'run',
      argv: ['expo', 'run:ios'],
      reason: 'Builds, installs, and starts the dev server.',
      timeClass: 'many-minutes',
    },
  ],
};

describe(formatTimeClass, () => {
  it(`should label every time class`, () => {
    expect(formatTimeClass('seconds')).toBe('~seconds');
    expect(formatTimeClass('a-minute')).toBe('~a minute');
    expect(formatTimeClass('minutes')).toBe('~a few minutes');
    expect(formatTimeClass('many-minutes')).toBe('~many minutes');
  });
});

describe(formatStartPlan, () => {
  it(`should report the rule and the target`, () => {
    expect(formatStartPlan(plan)).toMatch(/dev-client-stale/);
    expect(formatStartPlan(plan)).toMatch(/target: dev-client/);
  });

  it(`should list every step with its command, cost, and reason`, () => {
    const output = formatStartPlan(plan);

    expect(output).toMatch(/1\. expo prebuild --platform ios/);
    expect(output).toMatch(/2\. expo run:ios/);
    expect(output).toMatch(/~a minute/);
    expect(output).toMatch(/~many minutes/);
    expect(output).toMatch(/Generates the ios project from the app config\./);
    expect(output).toMatch(/Builds, installs, and starts the dev server\./);
  });

  it(`should list every reason`, () => {
    const output = formatStartPlan(plan);

    for (const reason of plan.reasons) {
      expect(output).toContain(reason);
    }
  });

  it(`should format a plan of one step`, () => {
    const output = formatStartPlan({
      ...plan,
      rule: 'expo-go',
      target: 'expo-go',
      steps: [
        {
          id: 'start',
          argv: ['expo', 'start', '--go'],
          reason: 'Opens in Expo Go.',
          timeClass: 'seconds',
        },
      ],
    });

    expect(output).toMatch(/1\. expo start --go/);
    expect(output).not.toMatch(/2\./);
  });
});
