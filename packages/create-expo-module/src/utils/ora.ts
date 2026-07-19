import chalk from 'chalk';
import ora from 'ora';

export type StepOptions = ora.Options;

export async function newStep<Result>(
  title: string,
  action: (step: ora.Ora) => Promise<Result> | Result,
  options: StepOptions = {}
): Promise<Result> {
  const disabled = process.env.CI || process.env.EXPO_DEBUG;
  const step = ora({
    text: chalk.bold(title),
    isEnabled: !disabled,
    stream: disabled ? process.stdout : process.stderr,
    ...options,
  });

  step.start();

  try {
    return await action(step);
  } catch (error) {
    step.fail();
    console.error(error);
    process.exit(1);
  }
}
