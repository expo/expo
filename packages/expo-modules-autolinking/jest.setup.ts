jest.mock('fs');
jest.mock('fs/promises');

// Work-around to mock node built-in modules
jest.mock('node:fs', () => require('fs'));
jest.mock('node:fs/promises', () => require('fs/promises'));
