/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#import "ABI18_0_0RCTSamplingProfilerPackagerMethod.h"

#import <JavaScriptCore/JavaScriptCore.h>

#import <ReactABI18_0_0/ABI18_0_0RCTBridge+JavaScriptCore.h>
#import <ABI18_0_0jschelpers/ABI18_0_0JavaScriptCore.h>

#import "ABI18_0_0RCTBridge.h"
#import "ABI18_0_0RCTLog.h"

#if ABI18_0_0RCT_DEV // Only supported in dev mode

@implementation ABI18_0_0RCTSamplingProfilerPackagerMethod {
  __weak ABI18_0_0RCTBridge *_bridge;
}

- (instancetype)initWithBridge:(ABI18_0_0RCTBridge *)bridge
{
  if (self = [super init]) {
    _bridge = bridge;
  }
  return self;
}

- (void)handleRequest:(__unused id)params withResponder:(ABI18_0_0RCTPackagerClientResponder *)responder
{
  JSGlobalContextRef globalContext = [_bridge jsContextRef];
  if (!JSC_JSSamplingProfilerEnabled(globalContext)) {
    [responder respondWithError:@"The JSSamplingProfiler is disabled. See 'iOS specific setup' section here https://fburl.com/u4lw7xeq for some help"];
    return;
  }

  // JSPokeSamplingProfiler() toggles the profiling process
  JSValueRef jsResult = JSC_JSPokeSamplingProfiler(globalContext);
  if (JSC_JSValueGetType(globalContext, jsResult) == kJSTypeNull) {
    [responder respondWithResult:@"started"];
  } else {
    JSContext *context = [_bridge jsContext];
    NSString *results = [[JSC_JSValue(globalContext) valueWithJSValueRef:jsResult inContext:context] toObject];
    [responder respondWithResult:results];
  }
}

- (void)handleNotification:(__unused id)params
{
  ABI18_0_0RCTLogError(@"%@ does not implement onNotification", [self class]);
}

@end

#endif
