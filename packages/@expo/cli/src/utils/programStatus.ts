import { stripAnsi } from './ansi';
import { isInteractive } from './interactive';

export type ProgramStatus =
  | {
      state: 'blocked';
      kind: 'permission' | 'question' | 'auth';
      msg?: string;
    }
  | {
      state: 'working';
      msg?: string;
    };

export type ProgramResult = {
  state: 'done' | 'error';
  msg?: string;
};

let hasReportedWorking = false;

function writeProgramStatus(status: ProgramStatus | ProgramResult | 'clear') {
  try {
    if (isInteractive()) {
      const body = status === 'clear' ? 'state=clear' : formatProgramStatus(status);
      process.stdout.write(`\x1b]7501;${body}\x1b\\`);
    }
  } catch {}
}

function formatProgramStatus(status: ProgramStatus | ProgramResult): string {
  const text = status.msg
    ? stripAnsi(status.msg)
        ?.replace(/[\s\p{Cc}]+/gu, ' ')
        .trim()
    : undefined;
  const kind = status.state === 'blocked' ? `:kind=${status.kind}` : '';
  return `state=${status.state}:app=expo${kind}${text ? `:msg=${Buffer.from(text).toString('base64')}` : ''}`;
}

export async function withProgramStatus<T>(
  status: ProgramStatus,
  action: () => Promise<T>
): Promise<T> {
  const clear = () => writeProgramStatus('clear');
  if (status.state === 'working') {
    hasReportedWorking = true;
  }
  writeProgramStatus(status);
  process.on('exit', clear);
  try {
    return await action();
  } finally {
    process.off('exit', clear);
    clear();
  }
}

export function reportProgramResult(result: ProgramResult) {
  if (hasReportedWorking) {
    writeProgramStatus(result);
  }
}
