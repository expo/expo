export default jest.fn().mockImplementation(() => ({
  logger: jest.fn(),
  identify: jest.fn(),
  track: jest.fn(),
}));
