/**
 * Copyright (c) 2015-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "ABI30_0_0RCTExceptionsManager.h"

#import "ABI30_0_0RCTConvert.h"
#import "ABI30_0_0RCTDefines.h"
#import "ABI30_0_0RCTLog.h"
#import "ABI30_0_0RCTRedBox.h"
#import "ABI30_0_0RCTRootView.h"

@implementation ABI30_0_0RCTExceptionsManager

@synthesize bridge = _bridge;

ABI30_0_0RCT_EXPORT_MODULE()

- (instancetype)initWithDelegate:(id<ABI30_0_0RCTExceptionsManagerDelegate>)delegate
{
  if ((self = [self init])) {
    _delegate = delegate;
  }
  return self;
}

ABI30_0_0RCT_EXPORT_METHOD(reportSoftException:(NSString *)message
                  stack:(NSArray<NSDictionary *> *)stack
                  exceptionId:(nonnull NSNumber *)exceptionId)
{
  [_bridge.redBox showErrorMessage:message withStack:stack];

  if (_delegate) {
    [_delegate handleSoftJSExceptionWithMessage:message stack:stack exceptionId:exceptionId];
  }
}

ABI30_0_0RCT_EXPORT_METHOD(reportFatalException:(NSString *)message
                  stack:(NSArray<NSDictionary *> *)stack
                  exceptionId:(nonnull NSNumber *)exceptionId)
{
  [_bridge.redBox showErrorMessage:message withStack:stack];

  if (_delegate) {
    [_delegate handleFatalJSExceptionWithMessage:message stack:stack exceptionId:exceptionId];
  }

  static NSUInteger reloadRetries = 0;
  if (!ABI30_0_0RCT_DEBUG && reloadRetries < _maxReloadAttempts) {
    reloadRetries++;
    [_bridge reload];
  } else {
    NSString *description = [@"Unhandled JS Exception: " stringByAppendingString:message];
    NSDictionary *errorInfo = @{ NSLocalizedDescriptionKey: description, ABI30_0_0RCTJSStackTraceKey: stack };
    ABI30_0_0RCTFatal([NSError errorWithDomain:ABI30_0_0RCTErrorDomain code:0 userInfo:errorInfo]);
  }
}

ABI30_0_0RCT_EXPORT_METHOD(updateExceptionMessage:(NSString *)message
                  stack:(NSArray<NSDictionary *> *)stack
                  exceptionId:(nonnull NSNumber *)exceptionId)
{
  [_bridge.redBox updateErrorMessage:message withStack:stack];

  if (_delegate && [_delegate respondsToSelector:@selector(updateJSExceptionWithMessage:stack:exceptionId:)]) {
    [_delegate updateJSExceptionWithMessage:message stack:stack exceptionId:exceptionId];
  }
}

// Deprecated.  Use reportFatalException directly instead.
ABI30_0_0RCT_EXPORT_METHOD(reportUnhandledException:(NSString *)message
                  stack:(NSArray<NSDictionary *> *)stack)
{
  [self reportFatalException:message stack:stack exceptionId:@-1];
}

@end
