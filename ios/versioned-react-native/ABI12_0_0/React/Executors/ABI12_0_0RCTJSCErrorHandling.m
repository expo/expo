/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#include "ABI12_0_0RCTJSCErrorHandling.h"

#import "ABI12_0_0RCTAssert.h"
#import "ABI12_0_0RCTJSStackFrame.h"
#import "ABI12_0_0RCTJSCWrapper.h"

NSString *const ABI12_0_0RCTJSExceptionUnsymbolicatedStackTraceKey = @"ABI12_0_0RCTJSExceptionUnsymbolicatedStackTraceKey";

NSError *ABI12_0_0RCTNSErrorFromJSError(JSValue *exception)
{
  NSMutableDictionary *userInfo = [NSMutableDictionary dictionary];
  userInfo[NSLocalizedDescriptionKey] = [NSString stringWithFormat:@"Unhandled JS Exception: %@", [exception[@"name"] toString] ?: @"Unknown"];
  NSString *const exceptionMessage = [exception[@"message"] toString];
  if ([exceptionMessage length]) {
    userInfo[NSLocalizedFailureReasonErrorKey] = exceptionMessage;
  }
  NSString *const stack = [exception[@"stack"] toString];
  if ([stack length]) {
    NSArray<ABI12_0_0RCTJSStackFrame *> *const unsymbolicatedFrames = [ABI12_0_0RCTJSStackFrame stackFramesWithLines:stack];
    userInfo[ABI12_0_0RCTJSStackTraceKey] = unsymbolicatedFrames;
  }
  return [NSError errorWithDomain:ABI12_0_0RCTErrorDomain code:1 userInfo:userInfo];
}

NSError *ABI12_0_0RCTNSErrorFromJSErrorRef(JSValueRef exceptionRef, JSGlobalContextRef ctx, ABI12_0_0RCTJSCWrapper *jscWrapper)
{
  JSContext *context = [jscWrapper->JSContext contextWithJSGlobalContextRef:ctx];
  JSValue *exception = [jscWrapper->JSValue valueWithJSValueRef:exceptionRef inContext:context];
  return ABI12_0_0RCTNSErrorFromJSError(exception);
}
