export const resolveMetroPortAsync = jest.fn(
  async (root, { defaultPort, fallbackPort } = {}) => defaultPort ?? fallbackPort ?? 8081
);
export const resolvePortAsync = jest.fn(
  async (root, { defaultPort, preferredPort }) => defaultPort ?? preferredPort
);
export const ensurePortAvailabilityAsync = jest.fn(async () => true);
