export default function hasSessionSecret(session: { sessionSecret: string | null }): boolean {
  return !!session.sessionSecret;
}
