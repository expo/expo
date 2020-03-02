/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "ABI37_0_0RCTExceptionsManager.h"

#import <ABI37_0_0FBReactNativeSpec/ABI37_0_0FBReactNativeSpec.h>
#import <ABI37_0_0React/ABI37_0_0RCTConvert.h>
#import <ABI37_0_0React/ABI37_0_0RCTDefines.h>
#import <ABI37_0_0React/ABI37_0_0RCTLog.h>
#import <ABI37_0_0React/ABI37_0_0RCTRedBox.h>
#import <ABI37_0_0React/ABI37_0_0RCTRootView.h>

#import "ABI37_0_0CoreModulesPlugins.h"

@interface ABI37_0_0RCTExceptionsManager() <NativeExceptionsManagerSpec>

@end

@implementation ABI37_0_0RCTExceptionsManager

@synthesize bridge = _bridge;

ABI37_0_0RCT_EXPORT_MODULE()

- (instancetype)initWithDelegate:(id<ABI37_0_0RCTExceptionsManagerDelegate>)delegate
{
  if ((self = [self init])) {
    _delegate = delegate;
  }
  return self;
}

ABI37_0_0RCT_EXPORT_METHOD(reportSoftException:(NSString *)message
                  stack:(NSArray<NSDictionary *> *)stack
                  exceptionId:(double)exceptionId)
{
  [_bridge.redBox showErrorMessage:message withStack:stack];

  if (_delegate) {
    [_delegate handleSoftJSExceptionWithMessage:message stack:stack exceptionId:[NSNumber numberWithDouble:exceptionId]];
  }
}

ABI37_0_0RCT_EXPORT_METHOD(reportFatalException:(NSString *)message
                  stack:(NSArray<NSDictionary *> *)stack
                  exceptionId:(double) exceptionId)
{
  [_bridge.redBox showErrorMessage:message withStack:stack];

  if (_delegate) {
    [_delegate handleFatalJSExceptionWithMessage:message stack:stack exceptionId:[NSNumber numberWithDouble:exceptionId]];
  }

  static NSUInteger reloadRetries = 0;
  if (!ABI37_0_0RCT_DEBUG && reloadRetries < _maxReloadAttempts) {
    reloadRetries++;
    [_bridge reload];
  } else {
    NSString *description = [@"Unhandled JS Exception: " stringByAppendingString:message];
    NSDictionary *errorInfo = @{ NSLocalizedDescriptionKey: description, ABI37_0_0RCTJSStackTraceKey: stack };
    ABI37_0_0RCTFatal([NSError errorWithDomain:ABI37_0_0RCTErrorDomain code:0 userInfo:errorInfo]);
  }
}

ABI37_0_0RCT_EXPORT_METHOD(updateExceptionMessage:(NSString *)message
                  stack:(NSArray<NSDictionary *> *)stack
                  exceptionId:(double)exceptionId)
{
  [_bridge.redBox updateErrorMessage:message withStack:stack];

  if (_delegate && [_delegate respondsToSelector:@selector(updateJSExceptionWithMessage:stack:exceptionId:)]) {
    [_delegate updateJSExceptionWithMessage:message stack:stack exceptionId:[NSNumber numberWithDouble:exceptionId]];
  }
}

// Deprecated.  Use reportFatalException directly instead.
ABI37_0_0RCT_EXPORT_METHOD(reportUnhandledException:(NSString *)message
                  stack:(NSArray<NSDictionary *> *)stack)
{
  [self reportFatalException:message stack:stack exceptionId:-1];
}

ABI37_0_0RCT_EXPORT_METHOD(dismissRedbox)
{

}

ABI37_0_0RCT_EXPORT_METHOD(reportException:(JS::NativeExceptionsManager::ExceptionData &)data)
{

}

- (std::shared_ptr<ABI37_0_0facebook::ABI37_0_0React::TurboModule>)getTurboModuleWithJsInvoker:
(std::shared_ptr<ABI37_0_0facebook::ABI37_0_0React::JSCallInvoker>)jsInvoker
{
  return std::make_shared<ABI37_0_0facebook::ABI37_0_0React::NativeExceptionsManagerSpecJSI>(self, jsInvoker);
}

@end

Class ABI37_0_0RCTExceptionsManagerCls(void)
{
  return ABI37_0_0RCTExceptionsManager.class;
}
