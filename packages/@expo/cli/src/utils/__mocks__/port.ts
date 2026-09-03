export const { isValidPort } = jest.requireActual('../port');

export const resolveMetroPortAsync = jest.fn(async (root, { defaultPort, fallbackPort } = {}) =>
  isValidPort(defaultPort) ? defaultPort : (fallbackPort ?? 8081)
);
export const _resolvePortAsync = jest.fn(async (root, { defaultPort, preferredPort }) =>
  isValidPort(defaultPort) ? defaultPort : preferredPort
);
export const ensurePortAvailabilityAsync = jest.fn(async () => true);
