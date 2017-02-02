export default function isUserAuthenticated(authTokens) {
  return !!(authTokens && authTokens.idToken);
}
