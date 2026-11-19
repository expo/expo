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
let lastStatusId = 0;

function writeProgramStatus(status: ProgramStatus | ProgramResult | 'clear', id?: number) {
  try {
    if (isInteractive()) {
      const body = status === 'clear' ? 'state=clear' : formatProgramStatus(status);
      process.stdout.write(`\x1b]7501;${body}${id ? `:id=${id}` : ''}\x1b\\`);
    }
  } catch {}
}

function formatProgramStatus(status: ProgramStatus | ProgramResult): string {
  const text = status.msg
    ? stripAnsi(status.msg)
        ?.replace(/[\s\p{Cc}]+/gu, ' ')
        .trim()
    : undefined;
  const msg = new Uint8Array(2048);
  const { written } = new TextEncoder().encodeInto(text ?? '', msg);
  const kind = status.state === 'blocked' ? `:kind=${status.kind}` : '';
  return `state=${status.state}:app=expo${kind}${written ? `:msg=${Buffer.from(msg.subarray(0, written)).toString('base64')}` : ''}`;
}

export async function withProgramStatus<T>(
  status: ProgramStatus,
  action: () => Promise<T>
): Promise<T> {
  const id = ++lastStatusId;
  const clear = () => writeProgramStatus('clear', id);
  if (status.state === 'working') {
    hasReportedWorking = true;
  }
  writeProgramStatus(status, id);
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
