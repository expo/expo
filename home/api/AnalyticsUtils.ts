export type TrackingOptions = {
  usernameOrEmail?: string;
  [key: string]: any;
};

export function normalizeTrackingOptions(options?: TrackingOptions): { [key: string]: any } | null {
  if (!options) {
    return null;
  }

  const { usernameOrEmail, ...rest } = options;

  if (usernameOrEmail) {
    if (usernameOrEmail.includes('@')) {
      rest.email = usernameOrEmail;
    } else {
      rest.username = usernameOrEmail;
    }
  }

  return rest;
}
