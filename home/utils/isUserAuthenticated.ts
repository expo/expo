export default function isUserAuthenticated(session: { sessionSecret: string | null }): boolean {
  return !!session.sessionSecret;
}
