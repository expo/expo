jest.mock('@expo/devcert');
jest.mock('@expo/image-utils');
jest.mock('@expo/osascript');
jest.mock('@expo/rudder-sdk-node');
jest.mock('@expo/spawn-async');
jest.mock('@expo/webpack-config');
jest.mock('@expo/package-manager');
jest.mock('child_process');
jest.mock('fs');
jest.mock('fs/promises');
jest.mock('better-opn');
jest.mock('env-editor');
jest.mock('internal-ip');
jest.mock('ora');
jest.mock('os');
jest.mock('progress');
jest.mock('resolve-from');
jest.mock('tar');
jest.mock('webpack-dev-server');
jest.mock('webpack');

jest.mock('../src/utils/createTempPath');

// Work-around to mock node built-in modules
jest.mock('node:fs', () => require('fs'));
jest.mock('node:fs/promises', () => require('fs/promises'));
