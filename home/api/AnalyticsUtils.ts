export type TrackingOptions = {
  usernameOrEmail: string;
  [key: string]: any;
};

export function normalizeTrackingOptions(options?: TrackingOptions): { [key: string]: any } | null {
  if (!options) {
    return null;
  }

  const { usernameOrEmail, ...rest } = options;

  if (usernameOrEmail.includes('@')) {
    rest.email = options.usernameOrEmail;
  } else {
    rest.username = options.usernameOrEmail;
  }

  return rest;
}
