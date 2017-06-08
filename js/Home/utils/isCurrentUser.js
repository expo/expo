/* @flow */

import jwtDecode from 'jwt-decode';

function extractUsername(idToken) {
  const { username } = jwtDecode(idToken, { complete: true });

  return username;
}

export default function isCurrentUser(
  authTokens: { idToken: ?string },
  username: string
) {
  if (!authTokens.idToken) {
    return false;
  }

  if (username.match(/@/)) {
    username = username.replace('@', '');
  }

  return extractUsername(authTokens.idToken) === username;
}
