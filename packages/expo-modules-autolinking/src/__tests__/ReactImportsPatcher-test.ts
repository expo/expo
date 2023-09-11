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
#if __has_include("RCTBridge.h")
#import "RCTBridge.h"
#elif __has_include("React/RCTBridge.h")
#import "React/RCTBridge.h"
#else
#import <React/RCTBridge.h>
#endif
`);

    await patchFileAsync(headerSet, 'someFile.h', /* dryRun */ false);
    expect(mockFsWriteFile.mock.calls[0][1]).toBe(`\
#if __has_include(<React/RCTBridge.h>)
#import <React/RCTBridge.h>
#elif __has_include(<React/RCTBridge.h>)
#import <React/RCTBridge.h>
#else
#import <React/RCTBridge.h>
#endif
`);
  });

  it('should transform double-quoted import which is indented', async () => {
    const headerSet = new Set(['RCTBridge.h']);
    mockFsReadFile.mockResolvedValue(`\
  #if __has_include("RCTBridge.h")
    #import "RCTBridge.h"
  #elif __has_include("React/RCTBridge.h")
    #import "React/RCTBridge.h"
  #else
    #import <React/RCTBridge.h>
  #endif
`);

    await patchFileAsync(headerSet, 'someFile.h', /* dryRun */ false);
    expect(mockFsWriteFile.mock.calls[0][1]).toBe(`\
  #if __has_include(<React/RCTBridge.h>)
    #import <React/RCTBridge.h>
  #elif __has_include(<React/RCTBridge.h>)
    #import <React/RCTBridge.h>
  #else
    #import <React/RCTBridge.h>
  #endif
`);
  });

  it('should transform double-quoted import which has trailing spaces', async () => {
    const headerSet = new Set(['RCTBridge.h']);
    mockFsReadFile.mockResolvedValue(`\
#if __has_include("RCTBridge.h")${' '}
  #import "RCTBridge.h"${'  '}
#elif __has_include("React/RCTBridge.h")${'   '}  
  #import "React/RCTBridge.h"${'    '}
#else
  #import <React/RCTBridge.h>  
#endif
`);

    await patchFileAsync(headerSet, 'someFile.h', /* dryRun */ false);
    expect(mockFsWriteFile.mock.calls[0][1]).toBe(`\
#if __has_include(<React/RCTBridge.h>)${' '}
  #import <React/RCTBridge.h>${'  '}
#elif __has_include(<React/RCTBridge.h>)${'   '}  
  #import <React/RCTBridge.h>${'    '}
#else
  #import <React/RCTBridge.h>  
#endif
`);
  });

  it('should not transform non-React-Core headers', async () => {
    const headerSet = new Set(['UIView+React.h']);
    mockFsReadFile.mockResolvedValue(`\
#if __has_include("UIView+React.h")
#import "UIView+React.h"
#endif

#if __has_include("UIView+ThirdPartyCategory.h")
#import "UIView+ThirdPartyCategory.h"
#endif
`);

    await patchFileAsync(headerSet, 'someFile.h', /* dryRun */ false);
    expect(mockFsWriteFile.mock.calls[0][1]).toBe(`\
#if __has_include(<React/UIView+React.h>)
#import <React/UIView+React.h>
#endif

#if __has_include("UIView+ThirdPartyCategory.h")
#import "UIView+ThirdPartyCategory.h"
#endif
`);
  });

  it('should not write changes when `dryRun` is true', async () => {
    const headerSet = new Set(['RCTBridge.h']);
    mockFsReadFile.mockResolvedValue(`#import "RCTBridge.h"`);
    await patchFileAsync(headerSet, 'someFile.h', /* dryRun */ true);
    expect(mockFsWriteFile.mock.calls[0]).toBeUndefined();
  });
});
