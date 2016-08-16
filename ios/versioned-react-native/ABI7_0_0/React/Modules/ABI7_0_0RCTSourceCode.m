/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#import "ABI7_0_0RCTSourceCode.h"

#import "ABI7_0_0RCTDefines.h"
#import "ABI7_0_0RCTAssert.h"
#import "ABI7_0_0RCTBridge.h"
#import "ABI7_0_0RCTUtils.h"

@implementation ABI7_0_0RCTSourceCode

ABI7_0_0RCT_EXPORT_MODULE()

@synthesize bridge = _bridge;

#if !ABI7_0_0RCT_DEV
- (void)setScriptText:(NSString *)scriptText {}
#endif

NSString *const ABI7_0_0RCTErrorUnavailable = @"E_SOURCE_CODE_UNAVAILABLE";

ABI7_0_0RCT_EXPORT_METHOD(getScriptText:(ABI7_0_0RCTPromiseResolveBlock)resolve
                  reject:(ABI7_0_0RCTPromiseRejectBlock)reject)
{
  if (ABI7_0_0RCT_DEV && self.scriptData && self.scriptURL) {
    NSString *scriptText = [[NSString alloc] initWithData:self.scriptData encoding:NSUTF8StringEncoding];
    resolve(@{@"text": ABI7_0_0RCTNullIfNil(scriptText), @"url": self.scriptURL.absoluteString});
  } else {
    reject(ABI7_0_0RCTErrorUnavailable, nil, ABI7_0_0RCTErrorWithMessage(@"Source code is not available"));
  }
}

- (NSDictionary<NSString *, id> *)constantsToExport
{
  NSString *URL = self.bridge.bundleURL.absoluteString ?: @"";
  return @{@"scriptURL": URL};
}

@end
