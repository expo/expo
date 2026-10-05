export const { isValidPort, createPortInUseError } = jest.requireActual('../port');

export const resolveMetroPortAsync = jest.fn(async (root, { defaultPort, fallbackPort } = {}) => ({
  kind: 'port',
  port: isValidPort(defaultPort) ? defaultPort : (fallbackPort ?? 8081),
}));
export const _resolvePortAsync = jest.fn(async (root, { defaultPort, preferredPort }) => ({
  kind: 'port',
  port: isValidPort(defaultPort) ? defaultPort : preferredPort,
}));
export const ensurePortAvailabilityAsync = jest.fn(async () => true);
