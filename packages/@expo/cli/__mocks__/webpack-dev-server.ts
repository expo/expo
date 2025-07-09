export default jest.fn(() => ({
  listen: jest.fn(),
  sendMessage: jest.fn(),
  close: jest.fn(),
}));
