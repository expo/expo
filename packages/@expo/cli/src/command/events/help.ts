import chalk from 'chalk';

/** Shared by the command overview and this subcommand's full help. */
export function getHelp(includeOptions = true): string {
  return [
    '',
    includeOptions ? chalk`  {bold Info}` : chalk`  {bold events [selector] [--tail]}`,
    '    Replays retained events from running or stopped sessions as JSONL to stdout, oldest first.',
    '    Use command:ps --json to discover session IDs and metadata.',
    '',
    ...(includeOptions
      ? [
          chalk`  {bold Usage}`,
          chalk`    {dim $} npx expo command:events {dim [selector] [--tail]}`,
          '',
          chalk`  {bold Options}`,
          '    selector                 Session ID, PID, or substring of CWD or command',
          '    --since <time>           Duration ago (5m, 90s), Unix time, or ISO date',
          '    --filter <pattern>       Event-name prefixes on whole segments; * wildcards;',
          '                             comma-separated or repeated, e.g. metro:bundling',
          '    --spans                  Keep only span events (with a _d duration)',
          '    --tail                   Follow live events after replay until the session stops',
          '    --help, -h                Show this help',
          '',
        ]
      : []),
    '    If several sessions match and exactly one is running, it is selected.',
    '    Otherwise, specify a session ID or PID from the listed candidates.',
    '    Omit the selector to use the only running session, or the only recorded session',
    '    if none are running.',
    '',
    '    Events: {"_e":"category:kind","_t":<epoch ms>,...}. _d is a span duration',
    '    in milliseconds; _w identifies a worker.',
    '',
    chalk`  {bold Examples}`,
    chalk`    {dim $} npx expo command:events <session-id> --since 5m`,
    chalk`    {dim $} npx expo command:events "expo start" --filter metro:bundling --spans`,
    chalk`    {dim $} npx expo command:events <session-id> --tail`,
    '',
  ].join('\n');
}
