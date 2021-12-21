import fs from 'fs-extra';

import { patchFileAsync } from '../ReactImportsPatcher';

jest.mock('fs-extra');

describe(patchFileAsync, () => {
  let mockFsReadFile;
  let mockFsWriteFile;

  beforeAll(() => {
    // suppress logging
    global.console.log = jest.fn();
  });

  beforeEach(() => {
    jest.resetAllMocks();
    mockFsReadFile = fs.readFile as jest.MockedFunction<typeof fs.readFile>;
    mockFsWriteFile = fs.writeFile as jest.MockedFunction<typeof fs.writeFile>;
  });

  it('should transform double-quoted import', async () => {
    const headerSet = new Set(['RCTBridge.h']);
    mockFsReadFile.mockResolvedValue(`\
#import "RCTBridge.h"
#import "React/RCTBridge.h"
#import <React/RCTBridge.h>`);

    await patchFileAsync(headerSet, 'someFile.h', /* dryRun */ false);
    expect(mockFsWriteFile.mock.calls[0][1]).toBe(`\
#import <React/RCTBridge.h>
#import <React/RCTBridge.h>
#import <React/RCTBridge.h>`);
  });

  it('should not transform non-React-Core headers', async () => {
    const headerSet = new Set(['UIView+React.h']);
    mockFsReadFile.mockResolvedValue(`\
#import "UIView+React.h"
#import "UIView+ThirdPartyCategory.h"`);

    await patchFileAsync(headerSet, 'someFile.h', /* dryRun */ false);
    expect(mockFsWriteFile.mock.calls[0][1]).toBe(`\
#import <React/UIView+React.h>
#import "UIView+ThirdPartyCategory.h"`);
  });

  it('should not write changes when `dryRun` is true', async () => {
    const headerSet = new Set(['RCTBridge.h']);
    mockFsReadFile.mockResolvedValue(`#import "RCTBridge.h"`);
    await patchFileAsync(headerSet, 'someFile.h', /* dryRun */ true);
    expect(mockFsWriteFile.mock.calls[0]).toBeUndefined();
  });
});
