/* @flow */

export function normalizeTrackingOptions(options?: ?Object = null) {
  if (!options) {
    return options;
  }

  let result = { ...options };

  if (result.usernameOrEmail) {
    let { usernameOrEmail } = result;
    delete result.usernameOrEmail;

    if (usernameOrEmail.includes('@')) {
      result.email = usernameOrEmail;
    } else {
      result.username = usernameOrEmail;
    }
  }

  return result;
}
