/* @flow */

export default function isUserAuthenticated(
  authTokens: ?{ idToken: ?string },
  session: ?{ sessionSecret: ?string }
) {
  return !!(authTokens && authTokens.idToken) || !!(session && session.sessionSecret);
}
