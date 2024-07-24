export const resolvePortAsync = jest.fn(
  async (root, { defaultPort, fallbackPort }) => defaultPort ?? fallbackPort ?? 8081
);
export const ensurePortAvailabilityAsync = jest.fn(async () => true);
