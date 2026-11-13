import { list, type ListedSession } from '2g/api';

/** Expo installs the logger with an explicit `expo <command>` label. */
export async function listExpoSessions(selector?: string): Promise<ListedSession[]> {
  const sessions = (await list()).filter(
    (session) =>
      session.command.startsWith('expo ') &&
      session.command !== 'expo command' &&
      !session.command.startsWith('expo command:')
  );
  const input = selector?.trim();
  if (!input) return sessions;

  // Match like 2g, but only let Expo sessions take precedence over substring matches.
  const exact = sessions.filter((session) => sessionSearchValues(session).includes(input));
  if (exact.length) return exact;
  const normalized = input.toLowerCase();
  return sessions.filter((session) =>
    sessionSearchValues(session).some((value) => value.toLowerCase().includes(normalized))
  );
}

function sessionSearchValues(session: ListedSession): string[] {
  return [
    session.id,
    String(session.pid),
    session.sessionDir,
    session.cwd,
    session.command,
    session.origin?.cwd,
    session.origin?.argv.join(' '),
    session.origin?.execPath,
    session.origin?.env?.npmLifecycleEvent,
    session.origin?.env?.npmPackageName,
  ].filter((value): value is string => !!value);
}

export async function resolveExpoSession(selector?: string): Promise<ListedSession> {
  const sessions = await listExpoSessions(selector);
  const active = sessions.filter((session) => session.alive);
  if (sessions.length === 1) return sessions[0]!;
  if (active.length === 1) return active[0]!;

  const match = selector ? ` matching ${JSON.stringify(selector)}` : '';
  if (!sessions.length) {
    throw new Error(
      `No Expo CLI sessions found${match}. Run \`npx expo command:ps --json\` to list sessions.`
    );
  }
  const candidates = active.length ? active : sessions;
  const omitted = sessions.length - candidates.length;
  throw new Error(
    `Ambiguous Expo CLI session${match}; specify a session ID or PID:\n` +
      candidates.map(formatSessionCandidate).join('\n') +
      (omitted
        ? `\n\n${omitted} matching stopped session${omitted === 1 ? '' : 's'} omitted.`
        : '') +
      '\nRun `npx expo command:ps --json` to list all sessions.'
  );
}

function formatSessionCandidate(session: ListedSession): string {
  const { metadata } = session;
  const details = [
    `PID ${session.pid}`,
    session.alive ? 'alive' : 'exited',
    session.command.slice('expo '.length),
    !session.alive && `started ${new Date(session.startedAt).toISOString()}`,
    metadata.ready === true &&
      typeof metadata.port === 'number' &&
      `${session.alive ? 'port' : 'last port'} ${metadata.port}`,
    JSON.stringify(typeof metadata.projectRoot === 'string' ? metadata.projectRoot : session.cwd),
  ];
  return `  ${session.id} (${details.filter(Boolean).join(', ')})`;
}
