export const createForProject = jest.fn(() => ({
  addDevAsync: jest.fn(),
}));
export const NpmPackageManager = jest.fn(() => ({
  addGlobalAsync: jest.fn(),
}));
