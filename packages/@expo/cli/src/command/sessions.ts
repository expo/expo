import { list, type ListedSession } from '2g/api';

/** Expo installs the logger with an explicit `expo <command>` label. */
export async function listExpoSessions(selector?: string): Promise<ListedSession[]> {
  return (await list({ selector })).filter(
    (session) =>
      session.command.startsWith('expo ') &&
      session.command !== 'expo command' &&
      !session.command.startsWith('expo command:')
  );
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
  throw new Error(
    `Ambiguous Expo CLI session${match}; specify a session ID or PID:\n` +
      sessions
        .map(
          (session) =>
            `  ${session.id} (PID ${session.pid}, ${session.command}, ${JSON.stringify(session.cwd)})`
        )
        .join('\n')
  );
}
