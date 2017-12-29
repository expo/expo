// Copyright 2015-present 650 Industries. All rights reserved.

#import "EXFrameExceptionsManager.h"

#import <React/RCTBridge.h>
#import <React/RCTRedBox.h>

@implementation EXFrameExceptionsManager {
  __weak id<RCTExceptionsManagerDelegate> _delegate;
}

@synthesize bridge = _bridge;

+ (NSString *)moduleName { return @"RCTExceptionsManager"; }

- (instancetype)initWithDelegate:(id<RCTExceptionsManagerDelegate>)delegate
{
  if (self = [self init]) {
    _delegate = delegate;
  }
  return self;
}

RCT_EXPORT_METHOD(reportSoftException:(NSString *)message
                  stack:(NSArray<NSDictionary *> *)stack
                  exceptionId:(nonnull NSNumber *)exceptionId)
{
  // this will hit EXDisabledRedBox when not debugging
  [_bridge.redBox showErrorMessage:message withStack:stack];

  [_delegate handleSoftJSExceptionWithMessage:message stack:stack exceptionId:exceptionId];
}

RCT_EXPORT_METHOD(reportFatalException:(NSString *)message
                  stack:(NSArray<NSDictionary *> *)stack
                  exceptionId:(nonnull NSNumber *)exceptionId)
{
  // this will hit EXDisabledRedBox when not debugging
  [_bridge.redBox showErrorMessage:message withStack:stack];

  [_delegate handleFatalJSExceptionWithMessage:message stack:stack exceptionId:exceptionId];
}

RCT_EXPORT_METHOD(updateExceptionMessage:(NSString *)message
                  stack:(NSArray<NSDictionary *> *)stack
                  exceptionId:(nonnull NSNumber *)exceptionId)
{
  // this will hit EXDisabledRedBox when not debugging
  [_bridge.redBox updateErrorMessage:message withStack:stack];

  if ([_delegate respondsToSelector:@selector(updateJSExceptionWithMessage:stack:exceptionId:)]) {
    [_delegate updateJSExceptionWithMessage:message stack:stack exceptionId:exceptionId];
  }
}

@end
