import { patchChunk, ReactImportsPatchTransform } from '../ReactImportsPatcher';

describe(patchChunk, () => {
  it('should transform double-quoted import', async () => {
    const headerSet = new Set(['RCTBridge.h']);
    const origin = `
#if __has_include("RCTBridge.h")
#import "RCTBridge.h"
#elif __has_include("React/RCTBridge.h")
#import "React/RCTBridge.h"
#else
#import <React/RCTBridge.h>
#endif
`;
    const expected = `
#if __has_include(<React/RCTBridge.h>)
#import <React/RCTBridge.h>
#elif __has_include(<React/RCTBridge.h>)
#import <React/RCTBridge.h>
#else
#import <React/RCTBridge.h>
#endif
`;
    expect(patchChunk(origin, headerSet)).toBe(expected);
  });

  it('should transform double-quoted import which is indented', async () => {
    const headerSet = new Set(['RCTBridge.h']);
    const origin = `
  #if __has_include("RCTBridge.h")
    #import "RCTBridge.h"
  #elif __has_include("React/RCTBridge.h")
    #import "React/RCTBridge.h"
  #else
    #import <React/RCTBridge.h>
  #endif
`;
    const expected = `
  #if __has_include(<React/RCTBridge.h>)
    #import <React/RCTBridge.h>
  #elif __has_include(<React/RCTBridge.h>)
    #import <React/RCTBridge.h>
  #else
    #import <React/RCTBridge.h>
  #endif
`;
    expect(patchChunk(origin, headerSet)).toBe(expected);
  });

  it('should transform double-quoted import which has trailing spaces', async () => {
    const headerSet = new Set(['RCTBridge.h']);
    const origin = `
#if __has_include("RCTBridge.h")${' '}
  #import "RCTBridge.h"${'  '}
#elif __has_include("React/RCTBridge.h")${'   '}
  #import "React/RCTBridge.h"${'    '}
#else
  #import <React/RCTBridge.h>
#endif
`;
    const expected = `
#if __has_include(<React/RCTBridge.h>)${' '}
  #import <React/RCTBridge.h>${'  '}
#elif __has_include(<React/RCTBridge.h>)${'   '}
  #import <React/RCTBridge.h>${'    '}
#else
  #import <React/RCTBridge.h>
#endif
`;
    expect(patchChunk(origin, headerSet)).toBe(expected);
  });

  it('should not transform non-React-Core headers', async () => {
    const headerSet = new Set(['UIView+React.h']);
    const origin = `
#if __has_include("UIView+React.h")
#import "UIView+React.h"
#endif

#if __has_include("UIView+ThirdPartyCategory.h")
#import "UIView+ThirdPartyCategory.h"
#endif
`;
    const expected = `
#if __has_include(<React/UIView+React.h>)
#import <React/UIView+React.h>
#endif

#if __has_include("UIView+ThirdPartyCategory.h")
#import "UIView+ThirdPartyCategory.h"
#endif
`;
    expect(patchChunk(origin, headerSet)).toBe(expected);
  });
});

describe(ReactImportsPatchTransform, () => {
  it('should transform the first 16KB by default', async () => {
    const transformFn = jest.fn().mockImplementation((chunk) => chunk);
    const transform = new ReactImportsPatchTransform({ transformFn });
    const callback = jest.fn();
    transform._transform(Buffer.alloc(4 * 1024).fill(' '), 'utf-8', callback);
    transform._transform(Buffer.alloc(4 * 1024).fill(' '), 'utf-8', callback);
    transform._transform(Buffer.alloc(4 * 1024).fill(' '), 'utf-8', callback);
    transform._transform(Buffer.alloc(4 * 1024).fill(' '), 'utf-8', callback);
    transform._transform(Buffer.alloc(4 * 1024).fill(' '), 'utf-8', callback);
    transform._transform(Buffer.alloc(4 * 1024).fill(' '), 'utf-8', callback);
    expect(callback).toHaveBeenCalledTimes(6);
    expect(transformFn).toHaveBeenCalledTimes(4);
  });

  it('should transform with given `lengthOfFilePortionContainingHeadersToTransform` bytes', async () => {
    const transformFn = jest.fn().mockImplementation((chunk) => chunk);
    const transform = new ReactImportsPatchTransform({
      transformFn,
      lengthOfFilePortionContainingHeadersToTransform: 8 * 1024,
    });
    const callback = jest.fn();
    transform._transform(Buffer.alloc(4 * 1024).fill(' '), 'utf-8', callback);
    transform._transform(Buffer.alloc(4 * 1024).fill(' '), 'utf-8', callback);
    transform._transform(Buffer.alloc(4 * 1024).fill(' '), 'utf-8', callback);
    transform._transform(Buffer.alloc(4 * 1024).fill(' '), 'utf-8', callback);
    transform._transform(Buffer.alloc(4 * 1024).fill(' '), 'utf-8', callback);
    transform._transform(Buffer.alloc(4 * 1024).fill(' '), 'utf-8', callback);
    expect(callback).toHaveBeenCalledTimes(6);
    expect(transformFn).toHaveBeenCalledTimes(2);
  });
});
