// Copyright 2015-present 650 Industries. All rights reserved.

#import "ABI41_0_0EXLinkingManager.h"
#import "ABI41_0_0EXScopedModuleRegistry.h"
#import "ABI41_0_0EXUtil.h"

#import <ABI41_0_0React/ABI41_0_0RCTBridge.h>
#import <ABI41_0_0React/ABI41_0_0RCTEventDispatcher.h>
#import <ABI41_0_0React/ABI41_0_0RCTUtils.h>

NSString * const ABI41_0_0EXLinkingEventOpenUrl = @"url";

@interface ABI41_0_0EXLinkingManager ()

@property (nonatomic, weak) id <ABI41_0_0EXLinkingManagerScopedModuleDelegate> kernelLinkingDelegate;
@property (nonatomic, strong) NSURL *initialUrl;
@property (nonatomic) BOOL hasListeners;

@end

@implementation ABI41_0_0EXLinkingManager

ABI41_0_0EX_EXPORT_SCOPED_MODULE(ABI41_0_0RCTLinkingManager, KernelLinkingManager);

- (instancetype)initWithExperienceId:(NSString *)experienceId kernelServiceDelegate:(id)kernelServiceInstance params:(NSDictionary *)params
{
  if (self = [super initWithExperienceId:experienceId kernelServiceDelegate:kernelServiceInstance params:params]) {
    _kernelLinkingDelegate = kernelServiceInstance;
    _initialUrl = params[@"initialUri"];
  }
  return self;
}

#pragma mark - ABI41_0_0RCTEventEmitter methods

- (NSArray<NSString *> *)supportedEvents
{
  return @[ABI41_0_0EXLinkingEventOpenUrl];
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
    ABI41_0_0RCTFatal(ABI41_0_0RCTErrorWithMessage([NSString stringWithFormat:@"Tried to open a deep link to an invalid url: %@", url]));
    return;
  }
  if (_hasListeners) {
    [self sendEventWithName:ABI41_0_0EXLinkingEventOpenUrl body:@{@"url": url.absoluteString}];
  }
}

ABI41_0_0RCT_EXPORT_METHOD(openURL:(NSURL *)URL
                  resolve:(ABI41_0_0RCTPromiseResolveBlock)resolve
                  reject:(ABI41_0_0RCTPromiseRejectBlock)reject)
{
  if ([_kernelLinkingDelegate linkingModule:self shouldOpenExpoUrl:URL]) {
    [_kernelLinkingDelegate linkingModule:self didOpenUrl:URL.absoluteString];
    resolve(@YES);
  } else {
    [ABI41_0_0EXUtil performSynchronouslyOnMainThread:^{
      [ABI41_0_0RCTSharedApplication() openURL:URL options:@{} completionHandler:^(BOOL success) {
        if (success) {
          resolve(nil);
        } else {
          reject(ABI41_0_0RCTErrorUnspecified, [NSString stringWithFormat:@"Unable to open URL: %@", URL], nil);
        }
      }];
    }];
  }
}

ABI41_0_0RCT_EXPORT_METHOD(canOpenURL:(NSURL *)URL
                  resolve:(ABI41_0_0RCTPromiseResolveBlock)resolve
                  reject:(__unused ABI41_0_0RCTPromiseRejectBlock)reject)
{
  __block BOOL canOpen = [_kernelLinkingDelegate linkingModule:self shouldOpenExpoUrl:URL];
  if (!canOpen) {
    [ABI41_0_0EXUtil performSynchronouslyOnMainThread:^{
      canOpen = [ABI41_0_0RCTSharedApplication() canOpenURL:URL];
    }];
  }
  resolve(@(canOpen));
}

ABI41_0_0RCT_EXPORT_METHOD(openSettings:(ABI41_0_0RCTPromiseResolveBlock)resolve
                        reject:(ABI41_0_0RCTPromiseRejectBlock)reject)
{
  [ABI41_0_0EXUtil performSynchronouslyOnMainThread:^{
    NSURL *url = [NSURL URLWithString:UIApplicationOpenSettingsURLString];
    [ABI41_0_0RCTSharedApplication() openURL:url options:@{} completionHandler:^(BOOL success) {
      if (success) {
        resolve(nil);
      } else {
        reject(ABI41_0_0RCTErrorUnspecified, @"Unable to open app settings", nil);
      }
    }];
  }];
}

ABI41_0_0RCT_EXPORT_METHOD(getInitialURL:(ABI41_0_0RCTPromiseResolveBlock)resolve
                  reject:(__unused ABI41_0_0RCTPromiseRejectBlock)reject)
{
  resolve(ABI41_0_0RCTNullIfNil(_initialUrl.absoluteString));
}

@end
