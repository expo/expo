export const createForProject = jest.fn(() => ({
  addDevAsync: jest.fn(),
  addAsync: jest.fn(),
}));
export const NpmPackageManager = jest.fn(() => ({
  addGlobalAsync: jest.fn(),
}));
