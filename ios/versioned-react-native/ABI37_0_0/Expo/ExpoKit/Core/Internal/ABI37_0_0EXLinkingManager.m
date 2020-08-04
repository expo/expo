// Copyright 2015-present 650 Industries. All rights reserved.

#import "ABI37_0_0EXLinkingManager.h"
#import "ABI37_0_0EXScopedModuleRegistry.h"
#import "ABI37_0_0EXUtil.h"

#import <ABI37_0_0React/ABI37_0_0RCTBridge.h>
#import <ABI37_0_0React/ABI37_0_0RCTEventDispatcher.h>
#import <ABI37_0_0React/ABI37_0_0RCTUtils.h>

NSString * const ABI37_0_0EXLinkingEventOpenUrl = @"url";

@interface ABI37_0_0EXLinkingManager ()

@property (nonatomic, weak) id <ABI37_0_0EXLinkingManagerScopedModuleDelegate> kernelLinkingDelegate;
@property (nonatomic, strong) NSURL *initialUrl;
@property (nonatomic) BOOL hasListeners;

@end

@implementation ABI37_0_0EXLinkingManager

ABI37_0_0EX_EXPORT_SCOPED_MODULE(ABI37_0_0RCTLinkingManager, KernelLinkingManager);

- (instancetype)initWithExperienceId:(NSString *)experienceId kernelServiceDelegate:(id)kernelServiceInstance params:(NSDictionary *)params
{
  if (self = [super initWithExperienceId:experienceId kernelServiceDelegate:kernelServiceInstance params:params]) {
    _kernelLinkingDelegate = kernelServiceInstance;
    _initialUrl = params[@"initialUri"];
  }
  return self;
}

#pragma mark - ABI37_0_0RCTEventEmitter methods

- (NSArray<NSString *> *)supportedEvents
{
  return @[ABI37_0_0EXLinkingEventOpenUrl];
}

- (void)startObserving
{
  _hasListeners = YES;
}

- (void)stopObserving
{
  _hasListeners = NO;
}

#pragma mark - Linking methods

- (void)dispatchOpenUrlEvent:(NSURL *)url
{
  if (!url || !url.absoluteString) {
    ABI37_0_0RCTFatal(ABI37_0_0RCTErrorWithMessage([NSString stringWithFormat:@"Tried to open a deep link to an invalid url: %@", url]));
    return;
  }
  if (_hasListeners) {
    [self sendEventWithName:ABI37_0_0EXLinkingEventOpenUrl body:@{@"url": url.absoluteString}];
  }
}

ABI37_0_0RCT_EXPORT_METHOD(openURL:(NSURL *)URL
                  resolve:(ABI37_0_0RCTPromiseResolveBlock)resolve
                  reject:(ABI37_0_0RCTPromiseRejectBlock)reject)
{
  if ([_kernelLinkingDelegate linkingModule:self shouldOpenExpoUrl:URL]) {
    [_kernelLinkingDelegate linkingModule:self didOpenUrl:URL.absoluteString];
    resolve(@YES);
  } else {
    [ABI37_0_0EXUtil performSynchronouslyOnMainThread:^{
      [ABI37_0_0RCTSharedApplication() openURL:URL options:@{} completionHandler:^(BOOL success) {
        if (success) {
          resolve(nil);
        } else {
          reject(ABI37_0_0RCTErrorUnspecified, [NSString stringWithFormat:@"Unable to open URL: %@", URL], nil);
        }
      }];
    }];
  }
}

ABI37_0_0RCT_EXPORT_METHOD(canOpenURL:(NSURL *)URL
                  resolve:(ABI37_0_0RCTPromiseResolveBlock)resolve
                  reject:(__unused ABI37_0_0RCTPromiseRejectBlock)reject)
{
  __block BOOL canOpen = [_kernelLinkingDelegate linkingModule:self shouldOpenExpoUrl:URL];
  if (!canOpen) {
    [ABI37_0_0EXUtil performSynchronouslyOnMainThread:^{
      canOpen = [ABI37_0_0RCTSharedApplication() canOpenURL:URL];
    }];
  }
  resolve(@(canOpen));
}

ABI37_0_0RCT_EXPORT_METHOD(getInitialURL:(ABI37_0_0RCTPromiseResolveBlock)resolve
                  reject:(__unused ABI37_0_0RCTPromiseRejectBlock)reject)
{
  resolve(ABI37_0_0RCTNullIfNil(_initialUrl.absoluteString));
}

@end
