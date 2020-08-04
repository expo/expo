/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "ABI38_0_0RCTExceptionsManager.h"

#import <ABI38_0_0FBReactNativeSpec/ABI38_0_0FBReactNativeSpec.h>
#import <ABI38_0_0React/ABI38_0_0RCTConvert.h>
#import <ABI38_0_0React/ABI38_0_0RCTDefines.h>
#import <ABI38_0_0React/ABI38_0_0RCTLog.h>
#import <ABI38_0_0React/ABI38_0_0RCTRedBox.h>
#import <ABI38_0_0React/ABI38_0_0RCTReloadCommand.h>
#import <ABI38_0_0React/ABI38_0_0RCTRootView.h>

#import "ABI38_0_0CoreModulesPlugins.h"

@interface ABI38_0_0RCTExceptionsManager() <NativeExceptionsManagerSpec>

@end

@implementation ABI38_0_0RCTExceptionsManager

@synthesize bridge = _bridge;

ABI38_0_0RCT_EXPORT_MODULE()

- (instancetype)initWithDelegate:(id<ABI38_0_0RCTExceptionsManagerDelegate>)delegate
{
  if ((self = [self init])) {
    _delegate = delegate;
  }
  return self;
}

- (void)reportSoft: (NSString *)message stack:(NSArray<NSDictionary *> *)stack exceptionId:(double)exceptionId suppressRedBox: (BOOL) suppressRedBox {
    if (!suppressRedBox) {
        [_bridge.redBox showErrorMessage:message withStack:stack errorCookie:((int)exceptionId)];
    }

    if (_delegate) {
      [_delegate handleSoftJSExceptionWithMessage:message stack:stack exceptionId:[NSNumber numberWithDouble:exceptionId]];
    }
}

- (void)reportFatal: (NSString *)message stack:(NSArray<NSDictionary *> *)stack exceptionId:(double)exceptionId suppressRedBox: (BOOL) suppressRedBox {
    if (!suppressRedBox) {
        [_bridge.redBox showErrorMessage:message withStack:stack errorCookie:((int)exceptionId)];
    }

    if (_delegate) {
      [_delegate handleFatalJSExceptionWithMessage:message stack:stack exceptionId:[NSNumber numberWithDouble:exceptionId]];
    }

    static NSUInteger reloadRetries = 0;
    if (!ABI38_0_0RCT_DEBUG && reloadRetries < _maxReloadAttempts) {
      reloadRetries++;
      ABI38_0_0RCTTriggerReloadCommandListeners(@"JS Crash Reload");
    } else if (!ABI38_0_0RCT_DEV || !suppressRedBox) {
      NSString *description = [@"Unhandled JS Exception: " stringByAppendingString:message];
      NSDictionary *errorInfo = @{ NSLocalizedDescriptionKey: description, ABI38_0_0RCTJSStackTraceKey: stack };
      ABI38_0_0RCTFatal([NSError errorWithDomain:ABI38_0_0RCTErrorDomain code:0 userInfo:errorInfo]);
    }
}


ABI38_0_0RCT_EXPORT_METHOD(reportSoftException:(NSString *)message
                  stack:(NSArray<NSDictionary *> *)stack
                  exceptionId:(double)exceptionId)
{
  [self reportSoft:message stack:stack exceptionId:exceptionId suppressRedBox:NO];
}

ABI38_0_0RCT_EXPORT_METHOD(reportFatalException:(NSString *)message
                  stack:(NSArray<NSDictionary *> *)stack
                  exceptionId:(double) exceptionId)
{
  [self reportFatal:message stack:stack exceptionId:exceptionId suppressRedBox:NO];
}

ABI38_0_0RCT_EXPORT_METHOD(updateExceptionMessage:(NSString *)message
                  stack:(NSArray<NSDictionary *> *)stack
                  exceptionId:(double)exceptionId)
{
  [_bridge.redBox updateErrorMessage:message withStack:stack errorCookie:((int)exceptionId)];

  if (_delegate && [_delegate respondsToSelector:@selector(updateJSExceptionWithMessage:stack:exceptionId:)]) {
    [_delegate updateJSExceptionWithMessage:message stack:stack exceptionId:[NSNumber numberWithDouble:exceptionId]];
  }
}

// Deprecated.  Use reportFatalException directly instead.
ABI38_0_0RCT_EXPORT_METHOD(reportUnhandledException:(NSString *)message
                  stack:(NSArray<NSDictionary *> *)stack)
{
  [self reportFatalException:message stack:stack exceptionId:-1];
}

ABI38_0_0RCT_EXPORT_METHOD(dismissRedbox)
{

}

ABI38_0_0RCT_EXPORT_METHOD(reportException:(JS::NativeExceptionsManager::ExceptionData &)data)
{
  NSString *message = data.message();
  double exceptionId = data.id_();
  id<NSObject> extraData = data.extraData();

  // Reserialize data.stack() into an array of untyped dictionaries.
  // TODO: (moti) T53588496 Replace `(NSArray<NSDictionary *> *)stack` in
  // reportFatalException etc with a typed interface.
  NSMutableArray<NSDictionary *> *stackArray = [NSMutableArray<NSDictionary *> new];
  for (auto frame: data.stack()) {
    NSMutableDictionary * frameDict = [NSMutableDictionary new];
    if (frame.column().hasValue()) {
      frameDict[@"column"] = @(frame.column().value());
    }
    frameDict[@"file"] = frame.file();
    if (frame.lineNumber().hasValue()) {
        frameDict[@"lineNumber"] = @(frame.lineNumber().value());
    }
    frameDict[@"methodName"] = frame.methodName();
    if (frame.collapse().hasValue()) {
        frameDict[@"collapse"] = @(frame.collapse().value());
    }
    [stackArray addObject:frameDict];
  }
  NSDictionary *dict = (NSDictionary *)extraData;
    BOOL suppressRedBox = [[dict objectForKey:@"suppressRedBox"] boolValue];

  if (data.isFatal()) {
    [self reportFatal:message stack:stackArray exceptionId:exceptionId suppressRedBox:suppressRedBox];
  } else {
    [self reportSoft:message stack:stackArray exceptionId:exceptionId suppressRedBox:suppressRedBox];
  }
}

- (std::shared_ptr<ABI38_0_0facebook::ABI38_0_0React::TurboModule>)getTurboModuleWithJsInvoker:
(std::shared_ptr<ABI38_0_0facebook::ABI38_0_0React::CallInvoker>)jsInvoker
{
  return std::make_shared<ABI38_0_0facebook::ABI38_0_0React::NativeExceptionsManagerSpecJSI>(self, jsInvoker);
}

@end

Class ABI38_0_0RCTExceptionsManagerCls(void)
{
  return ABI38_0_0RCTExceptionsManager.class;
}
