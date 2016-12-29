// Copyright 2015-present 650 Industries. All rights reserved.

#import "EXExceptionHandler.h"
#import "EXKernel.h"
#import "EXViewController.h"

#import <Crashlytics/Crashlytics.h>
#import <React/RCTAssert.h>
#import <React/RCTBridge.h>
#import <React/RCTRedBox.h>

NS_ASSUME_NONNULL_BEGIN

@implementation EXExceptionHandler {
  RCTBridge *_bridge;
}

- (instancetype)initWithBridge:(RCTBridge *)bridge
{
  _bridge = bridge;
  return [super init];
}

RCT_NOT_IMPLEMENTED(- (instancetype)init)

- (void)handleSoftJSExceptionWithMessage:(NSString *)message
                                   stack:(NSArray<NSDictionary<NSString *, id> *> *)stack
                             exceptionId:(NSNumber *)exceptionId
{
  [_bridge.redBox showErrorMessage:message withStack:stack];
}

- (void)handleFatalJSExceptionWithMessage:(NSString *)message
                                    stack:(NSArray<NSDictionary<NSString *, id> *> *)stack
                              exceptionId:(NSNumber *)exceptionId
{
  [_bridge.redBox showErrorMessage:message withStack:stack];
  
  NSString *description = [@"Unhandled JS Exception: " stringByAppendingString:message];
  NSDictionary *errorInfo = @{ NSLocalizedDescriptionKey: description, RCTJSStackTraceKey: stack };
  NSError *error = [NSError errorWithDomain:RCTErrorDomain code:0 userInfo:errorInfo];

  if (!RCT_DEBUG) {
    [self _recordCrashlyticsExceptionFromMessage:message stack:stack];
    RCTFatal(error);
  }

  dispatch_async(dispatch_get_main_queue(), ^{
    // human-readable error, since RCTRedBox is disabled in production
    [[EXKernel sharedInstance].rootViewController
     showErrorWithType:kEXFatalErrorTypeException
     error:error];
  });
}

- (void)updateJSExceptionWithMessage:(NSString *)message
                               stack:(NSArray *)stack
                         exceptionId:(NSNumber *)exceptionId
{
  [_bridge.redBox updateErrorMessage:message withStack:stack];
}

- (void)_recordCrashlyticsExceptionFromMessage:(NSString *)message stack:(NSArray *)stack
{
  NSError *error;
  NSRegularExpression *regex = [NSRegularExpression regularExpressionWithPattern:@"^([a-z$_][a-z\\d$_]*):\\s*"
                                                                         options:NSRegularExpressionCaseInsensitive
                                                                           error:&error];
  if (!regex) {
    DDLogError(@"Error creating regular expression: %@", error.localizedDescription);
    return;
  }
  
  NSString *errorName;
  NSString *errorReason;
  NSTextCheckingResult *match = [regex firstMatchInString:message options:0 range:NSMakeRange(0, message.length)];
  if (match) {
    errorName = [message substringWithRange:[match rangeAtIndex:1]];
    errorName = [message substringFromIndex:match.range.location + match.range.length];
  } else {
    errorName = @"UnknownError";
    errorReason = message;
  }
  
  NSMutableArray *frameArray = [NSMutableArray arrayWithCapacity:stack.count];
  for (NSDictionary *frameInfo in stack) {
    CLSStackFrame *frame = [CLSStackFrame stackFrame];
    if ([frameInfo[@"file"] isKindOfClass:[NSString class]]) {
      frame.fileName = frameInfo[@"file"];
    }
    if ([frameInfo[@"methodName"] isKindOfClass:[NSString class]]) {
      frame.symbol = frameInfo[@"methodName"];
    }
    if ([frameInfo[@"lineNumber"] isKindOfClass:[NSNumber class]]) {
      frame.lineNumber = (uint32_t)MAX([frameInfo[@"lineNumber"] integerValue], 0);
    }
    [frameArray addObject:frame];
  }
  
  [[Crashlytics sharedInstance] recordCustomExceptionName:errorName reason:errorReason frameArray:frameArray];
}

@end

NS_ASSUME_NONNULL_END
