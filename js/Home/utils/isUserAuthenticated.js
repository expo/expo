/* @flow */

export default function isUserAuthenticated(authTokens: ?{ idToken: ?string }) {
  return !!(authTokens && authTokens.idToken);
}
