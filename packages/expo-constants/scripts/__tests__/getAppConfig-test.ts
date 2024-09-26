const { getConfig } = require('@expo/config');
const fs = require('fs');
const path = require('path');
const { load } = require('@expo/env');

jest.mock('fs');
jest.mock('path');
jest.mock('@expo/config');
jest.mock('@expo/env', () => ({
  load: jest.fn(),
}));

const possibleProjectRoot = '/path/to/project';
const destinationDir = '/path/to/destination';
const mockExpConfig = { some: 'config' };

describe('getAppConfig', () => {
  beforeAll(() => {
    jest.resetAllMocks();
    // Mock the arguments
    process.argv[2] = possibleProjectRoot;
    process.argv[3] = destinationDir;

    fs.existsSync.mockImplementation((filePath) => {
      if (filePath === path.join(possibleProjectRoot, 'package.json')) {
        return true;
      }
      return false;
    });

    path.join.mockImplementation((...args) => args.join('/'));
    path.resolve.mockImplementation((...args) => args.join('/'));
    jest.spyOn(process, 'chdir').mockImplementation(() => {});
    getConfig.mockReturnValue({ exp: mockExpConfig });

    // Import the script (this runs the script)
    require('../build/getAppConfig');
  });

  it('should call writeFileSync with the correct parameters', () => {
    // Verify writeFileSync was called with the expected arguments
    expect(fs.writeFileSync).toHaveBeenCalledWith(
      path.join(destinationDir, 'app.config'),
      JSON.stringify(mockExpConfig)
    );
  });

  it('should load from @expo/env', () => {
    expect(load).toHaveBeenCalledWith(possibleProjectRoot);
  })
});
