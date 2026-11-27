import { Terminal } from '@expo/metro/metro-core';
import type { Socket } from 'node:net';
import type { Writable } from 'node:stream';
import tty from 'node:tty';
import { format, stripVTControlCharacters } from 'node:util';

const IDLE_COMMIT_MS = 1000;

export interface LiveLogLine {
  /** Replaces the text of the line. Returns `false` once another line has been logged after it. */
  update(text: string): boolean;
}

interface LiveLogLineOptions {
  // Printed after the line when it is committed, in a terminal that cannot redraw it.
  summary?(): string | undefined;
}

interface LiveLine extends LiveLogLineOptions {
  text: string;
}

/**
 * A terminal whose last log line can be redrawn in place until another line is logged after it.
 * Where output cannot be redrawn, such as a pipe, the line prints once and its summary follows it.
 */
export class LiveLineTerminal extends Terminal {
  #ttyStream: tty.WriteStream | null;
  #status = '';
  #liveLine: LiveLine | null = null;
  #idleTimer: ReturnType<typeof setTimeout> | undefined;

  constructor(stream: Socket | Writable, opts: { ttyPrint?: boolean } = {}) {
    super(stream, opts);
    this.#ttyStream =
      (opts.ttyPrint ?? true) &&
      stream instanceof tty.WriteStream &&
      stream.isTTY &&
      stream.columns >= 1
        ? stream
        : null;
  }

  logLive(text: string, options: LiveLogLineOptions = {}): LiveLogLine {
    this.commitLiveLine();
    const ttyStream = this.#ttyStream;
    if (ttyStream && countRows(text, ttyStream.columns) > ttyStream.rows / 2) {
      super.log('%s', text);
      return { update: () => false };
    }

    const line: LiveLine = { text, ...options };
    this.#liveLine = line;
    if (ttyStream) {
      this.#drawStatus();
    } else {
      super.log('%s', text);
      this.#scheduleIdleCommit();
    }
    return {
      update: (nextText) => {
        if (this.#liveLine !== line) {
          return false;
        }
        line.text = nextText;
        if (ttyStream) {
          this.#drawStatus();
        } else {
          this.#scheduleIdleCommit();
        }
        return true;
      },
    };
  }

  commitLiveLine(): void {
    const line = this.#liveLine;
    if (!line) {
      return;
    }
    this.#liveLine = null;
    clearTimeout(this.#idleTimer);
    if (this.#ttyStream) {
      this.#drawStatus();
      super.log('%s', line.text);
    } else {
      const summary = line.summary?.();
      if (summary) {
        super.log('%s', summary);
      }
    }
  }

  log(logFormat: string, ...args: unknown[]): void {
    this.commitLiveLine();
    super.log(logFormat, ...args);
  }

  status(statusFormat: string, ...args: unknown[]): string {
    const previousStatus = this.#status;
    this.#status = format(statusFormat, ...args);
    this.#drawStatus();
    return previousStatus;
  }

  persistStatus(): void {
    this.commitLiveLine();
    super.persistStatus();
    this.#status = '';
  }

  #drawStatus(): void {
    const liveText = this.#ttyStream ? this.#liveLine?.text : undefined;
    super.status('%s', [liveText, this.#status].filter(Boolean).join('\n'));
  }

  #scheduleIdleCommit(): void {
    clearTimeout(this.#idleTimer);
    this.#idleTimer = setTimeout(() => this.commitLiveLine(), IDLE_COMMIT_MS);
  }
}

function countRows(text: string, columns: number): number {
  return text
    .split('\n')
    .reduce(
      (rows, line) =>
        rows + Math.max(1, Math.ceil(stripVTControlCharacters(line).length / columns)),
      0
    );
}
