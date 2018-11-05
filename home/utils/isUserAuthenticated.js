/* @flow */

export default function isUserAuthenticated(
  session: ?{ sessionSecret: ?string }
) {
  return !!(session && session.sessionSecret);
}
