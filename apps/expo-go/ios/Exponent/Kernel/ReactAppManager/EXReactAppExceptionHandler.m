// Copyright 2015-present 650 Industries. All rights reserved.

#import "EXAppViewController.h"
#import "EXErrorRecoveryManager.h"
#import "EXKernel.h"
#import "EXKernelAppRecord.h"
#import "EXReactAppManager.h"
#import "EXReactAppExceptionHandler.h"
#import "EXUtil.h"

#import <React/RCTBridge.h>
#import <React/RCTRedBox.h>

RCTFatalHandler handleFatalReactError = ^(NSError *error) {
  [EXUtil performSynchronouslyOnMainThread:^{
    EXKernelAppRecord *record = [[EXKernel sharedInstance].serviceRegistry.errorRecoveryManager appRecordForError:error];
    if (!record) {
      // show the error on Home or on the main standalone app if we can't figure out who this error belongs to
      if ([EXKernel sharedInstance].appRegistry.homeAppRecord) {
        record = [EXKernel sharedInstance].appRegistry.homeAppRecord;
      }
    }
    if (record) {
      [record.viewController maybeShowError:error];
    }
  }];
};

NS_ASSUME_NONNULL_BEGIN

@interface EXReactAppExceptionHandler ()

@property (nonatomic, weak) EXKernelAppRecord *appRecord;

@end

@implementation EXReactAppExceptionHandler

- (instancetype)initWithAppRecord:(EXKernelAppRecord *)appRecord
{
  if (self = [super init]) {
    _appRecord = appRecord;
  }
  return self;
}

RCT_NOT_IMPLEMENTED(- (instancetype)init)

- (void)handleSoftJSExceptionWithMessage:(nullable NSString *)message
                                   stack:(nullable NSArray<NSDictionary<NSString *, id> *> *)stack
                             exceptionId:(NSNumber *)exceptionId
                         extraDataAsJSON:(nullable NSString *)extraDataAsJSON
{
  // In RN 0.8 this was used to invoke the native red box errors (via `showErrorMessage`).
  // The invocation has since been moved into the method that invokes this delegate method.
  // https://github.com/facebook/react-native/commit/31b5b0ac010d44afe3e742e85c75a9ef9e72a9e0#diff-35e5d8a9e7e9ea80b2ccfd41b905b703
}

- (void)handleFatalJSExceptionWithMessage:(nullable NSString *)message
                                    stack:(nullable NSArray<NSDictionary<NSString *, id> *> *)stack
                              exceptionId:(NSNumber *)exceptionId
                          extraDataAsJSON:(nullable NSString *)extraDataAsJSON
{
  NSString *description = [@"Unhandled JS Exception: " stringByAppendingString:message];
  NSDictionary *errorInfo = @{ NSLocalizedDescriptionKey: description, RCTJSStackTraceKey: stack };
  NSError *error = [NSError errorWithDomain:RCTErrorDomain code:0 userInfo:errorInfo];

  [[EXKernel sharedInstance].serviceRegistry.errorRecoveryManager setError:error forScopeKey:_appRecord.scopeKey];

  if ([self _isProdHome]) {
    RCTFatal(error);
  }
}

- (void)updateJSExceptionWithMessage:(nullable NSString *)message
                               stack:(nullable NSArray *)stack
                         exceptionId:(NSNumber *)exceptionId
{
  RCTRedBox *redbox = (RCTRedBox *)[[[self _hostForRecord] moduleRegistry] moduleForName:"RedBox"];
  [redbox updateErrorMessage:message withStack:stack];
}

#pragma mark - internal

- (id)_hostForRecord
{
  return _appRecord.appManager.reactHost;
}

- (BOOL)_isProdHome
{
  if (RCT_DEBUG) {
    return NO;
  }
  return (_appRecord && _appRecord == [EXKernel sharedInstance].appRegistry.homeAppRecord);
}

@end

NS_ASSUME_NONNULL_END
