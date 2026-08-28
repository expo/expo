jest.mock('child_process');
jest.mock('fs');
jest.mock('fs/promises');
jest.mock('os');

// Work-around to mock node built-in modules
jest.mock('node:child_process', () => require('child_process'));
jest.mock('node:fs', () => require('fs'));
jest.mock('node:fs/promises', () => require('fs/promises'));
jest.mock('node:os', () => require('os'));
