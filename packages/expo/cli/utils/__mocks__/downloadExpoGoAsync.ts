export const downloadExpoGoAsync = jest.fn(
  async (platform: string): Promise<string> => `/path/to/${platform}/binary`
);
