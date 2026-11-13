import chalk from 'chalk';

import { listExpoSessions } from '../sessions';
import type { Options } from './resolveOptions';

export async function psAsync(options: Options) {
  const sessions = (await listExpoSessions(options.selector)).filter(
    (session) => !options.active || session.alive
  );
  if (options.json) {
    process.stdout.write(`${JSON.stringify(sessions, null, 2)}\n`);
    return;
  }
  process.stdout.write(chalk.bold('PID\tSTATUS\tSTARTED\tCOMMAND\tPROJECT\tPORT\tURL') + '\n');
  for (const session of sessions) {
    const { metadata } = session;
    const ready = session.alive && metadata.ready === true;
    process.stdout.write(
      [
        session.pid,
        session.alive ? chalk.green('alive') : chalk.dim('exited'),
        chalk.dim(new Date(session.startedAt).toISOString()),
        chalk.bold(session.command.slice('expo '.length)),
        chalk.dim(typeof metadata.projectRoot === 'string' ? metadata.projectRoot : session.cwd),
        ready && typeof metadata.port === 'number' ? chalk.cyan(metadata.port) : chalk.dim('-'),
        ready && typeof metadata.devServerUrl === 'string'
          ? chalk.underline(metadata.devServerUrl)
          : chalk.dim('-'),
      ]
        .map(escapeTsv)
        .join('\t') + '\n'
    );
  }
}

function escapeTsv(value: unknown) {
  return String(value)
    .replace(/\\/g, '\\\\')
    .replace(/\t/g, '\\t')
    .replace(/\r/g, '\\r')
    .replace(/\n/g, '\\n');
}
