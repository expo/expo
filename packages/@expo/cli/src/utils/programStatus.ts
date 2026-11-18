import { stripVTControlCharacters } from 'node:util';

import { isInteractive } from './interactive';

export type ProgramStatus =
  | {
      state: 'blocked';
      kind: 'permission' | 'question' | 'auth';
      msg?: string;
    }
  | {
      state: 'working';
      title?: string;
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
  const kind = status.state === 'blocked' ? `:kind=${status.kind}` : '';
  const title =
    status.state === 'working' && status.title ? encodeProgramStatusText(status.title, 192) : '';
  const msg = status.msg ? encodeProgramStatusText(status.msg, 2048) : '';
  return `state=${status.state}:app=expo${kind}${title ? `:title=${title}` : ''}${msg ? `:msg=${msg}` : ''}`;
}

function encodeProgramStatusText(text: string, maxBytes: number): string {
  const line = stripVTControlCharacters(text.slice(0, 8192))
    .replace(/[\s\p{Cc}]+/gu, ' ')
    .trim();
  const bytes = new Uint8Array(maxBytes);
  const { written } = new TextEncoder().encodeInto(line, bytes);
  return Buffer.from(bytes.subarray(0, written)).toString('base64');
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
