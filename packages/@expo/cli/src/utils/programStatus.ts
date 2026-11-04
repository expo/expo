import { stripAnsi } from './ansi';
import { isInteractive } from './interactive';

export type ProgramStatus = {
  state: 'blocked';
  kind: 'permission' | 'question' | 'auth';
  msg?: string;
};

function writeProgramStatus(body: string) {
  if (isInteractive()) {
    process.stdout.write(`\x1b]7501;${body}\x1b\\`);
  }
}

function formatProgramStatus({ state, kind, msg }: ProgramStatus): string {
  const text = msg
    ? stripAnsi(msg)
        ?.replace(/[\s\p{Cc}]+/gu, ' ')
        .trim()
    : undefined;
  return `state=${state}:app=expo:kind=${kind}${text ? `:msg=${Buffer.from(text).toString('base64')}` : ''}`;
}

export async function withProgramStatus<T>(
  status: ProgramStatus,
  action: () => Promise<T>
): Promise<T> {
  const clear = () => writeProgramStatus('state=clear');
  writeProgramStatus(formatProgramStatus(status));
  process.on('exit', clear);
  try {
    return await action();
  } finally {
    process.off('exit', clear);
    clear();
  }
}
