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
      } else if ([EXKernel sharedInstance].appRegistry.standaloneAppRecord) {
        record = [EXKernel sharedInstance].appRegistry.standaloneAppRecord;
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
{
  [[self _bridgeForRecord].redBox showErrorMessage:message withStack:stack];
}

- (void)handleFatalJSExceptionWithMessage:(nullable NSString *)message
                                    stack:(nullable NSArray<NSDictionary<NSString *, id> *> *)stack
                              exceptionId:(NSNumber *)exceptionId
{
  [[self _bridgeForRecord].redBox showErrorMessage:message withStack:stack];

  NSString *description = [@"Unhandled JS Exception: " stringByAppendingString:message];
  NSDictionary *errorInfo = @{ NSLocalizedDescriptionKey: description, RCTJSStackTraceKey: stack };
  NSError *error = [NSError errorWithDomain:RCTErrorDomain code:0 userInfo:errorInfo];

  [[EXKernel sharedInstance].serviceRegistry.errorRecoveryManager setError:error forExperienceId:_appRecord.experienceId];

  if ([self _isProdHome]) {
    RCTFatal(error);
  }
}

- (void)updateJSExceptionWithMessage:(nullable NSString *)message
                               stack:(nullable NSArray *)stack
                         exceptionId:(NSNumber *)exceptionId
{
  [[self _bridgeForRecord].redBox updateErrorMessage:message withStack:stack];
}

#pragma mark - internal

- (RCTBridge *)_bridgeForRecord
{
  return _appRecord.appManager.reactBridge;
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
