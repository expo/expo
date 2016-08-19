// Copyright 2015-present 650 Industries. All rights reserved.

#import "ABI9_0_0EXFrameExceptionsManager.h"

#import "ABI9_0_0RCTBridge.h"
#import "ABI9_0_0RCTRedBox.h"

@implementation ABI9_0_0EXFrameExceptionsManager {
  __weak id<ABI9_0_0RCTExceptionsManagerDelegate> _delegate;
}

@synthesize bridge = _bridge;

+ (NSString *)moduleName { return @"ABI9_0_0RCTExceptionsManager"; }

- (instancetype)initWithDelegate:(id<ABI9_0_0RCTExceptionsManagerDelegate>)delegate
{
  if (self = [self init]) {
    _delegate = delegate;
  }
  return self;
}

ABI9_0_0RCT_EXPORT_METHOD(reportSoftException:(NSString *)message
                  stack:(NSArray<NSDictionary *> *)stack
                  exceptionId:(nonnull NSNumber *)exceptionId)
{
  // this will hit ABI9_0_0EXDisabledRedBox when not debugging
  [_bridge.redBox showErrorMessage:message withStack:stack];

  [_delegate handleSoftJSExceptionWithMessage:message stack:stack exceptionId:exceptionId];
}

ABI9_0_0RCT_EXPORT_METHOD(reportFatalException:(NSString *)message
                  stack:(NSArray<NSDictionary *> *)stack
                  exceptionId:(nonnull NSNumber *)exceptionId)
{
  // this will hit ABI9_0_0EXDisabledRedBox when not debugging
  [_bridge.redBox showErrorMessage:message withStack:stack];

  [_delegate handleFatalJSExceptionWithMessage:message stack:stack exceptionId:exceptionId];
}

ABI9_0_0RCT_EXPORT_METHOD(updateExceptionMessage:(NSString *)message
                  stack:(NSArray<NSDictionary *> *)stack
                  exceptionId:(nonnull NSNumber *)exceptionId)
{
  // this will hit ABI9_0_0EXDisabledRedBox when not debugging
  [_bridge.redBox updateErrorMessage:message withStack:stack];

  if ([_delegate respondsToSelector:@selector(updateJSExceptionWithMessage:stack:exceptionId:)]) {
    [_delegate updateJSExceptionWithMessage:message stack:stack exceptionId:exceptionId];
  }
}

@end
