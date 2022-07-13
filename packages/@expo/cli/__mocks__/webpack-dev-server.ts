export default jest.fn(() => ({
  listen: jest.fn(),
  sockWrite: jest.fn(),
  close: jest.fn(),
}));
