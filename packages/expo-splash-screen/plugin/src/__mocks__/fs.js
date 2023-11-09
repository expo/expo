// __mocks__/fs.js

const fsMock = jest.createMockFromModule('fs');
fsMock.promises = {};
// Mock fs promise methods
fsMock.promises.readFile = () => Promise.resolve('Mocked content');
fsMock.promises.writeFile = () => Promise.resolve();

module.exports = fsMock;
