import chalk from 'chalk';

/** Shared by the command overview and this subcommand's full help. */
export function getHelp(includeOptions = true): string {
  return [
    '',
    includeOptions ? chalk`  {bold Info}` : chalk`  {bold ps [selector]}`,
    '    Lists running and stopped sessions, newest first, with their command, project,',
    '    and process status. Ready dev servers include connection details such as URL and port.',
    '',
    ...(includeOptions
      ? [
          chalk`  {bold Usage}`,
          chalk`    {dim $} npx expo command:ps {dim [selector]}`,
          '',
          chalk`  {bold Options}`,
          '    selector                 Session ID, PID, or substring of CWD or command',
          '    --active, -a              Show only running sessions',
          '    --json                    Print sessions as a JSON array (empty: [])',
          '    --help, -h                Show this help',
          '',
        ]
      : []),
    '    Use a session ID or PID to inspect its events with command:events.',
    '    Stopped sessions retain their history; their server endpoints may no longer be available.',
    '',
    chalk`  {bold Examples}`,
    chalk`    {dim $} npx expo command:ps --active --json`,
    chalk`    {dim $} npx expo command:ps "expo start" --json`,
    chalk`    {dim $} npx expo command:events <session-id> --since 5m`,
    '',
  ].join('\n');
}
