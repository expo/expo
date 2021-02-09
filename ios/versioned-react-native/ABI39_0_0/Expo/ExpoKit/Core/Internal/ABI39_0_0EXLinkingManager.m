// Copyright 2015-present 650 Industries. All rights reserved.

#import "ABI39_0_0EXLinkingManager.h"
#import "ABI39_0_0EXScopedModuleRegistry.h"
#import "ABI39_0_0EXUtil.h"

#import <ABI39_0_0React/ABI39_0_0RCTBridge.h>
#import <ABI39_0_0React/ABI39_0_0RCTEventDispatcher.h>
#import <ABI39_0_0React/ABI39_0_0RCTUtils.h>

NSString * const ABI39_0_0EXLinkingEventOpenUrl = @"url";

@interface ABI39_0_0EXLinkingManager ()

@property (nonatomic, weak) id <ABI39_0_0EXLinkingManagerScopedModuleDelegate> kernelLinkingDelegate;
@property (nonatomic, strong) NSURL *initialUrl;
@property (nonatomic) BOOL hasListeners;

@end

@implementation ABI39_0_0EXLinkingManager

ABI39_0_0EX_EXPORT_SCOPED_MODULE(ABI39_0_0RCTLinkingManager, KernelLinkingManager);

- (instancetype)initWithExperienceId:(NSString *)experienceId kernelServiceDelegate:(id)kernelServiceInstance params:(NSDictionary *)params
{
  if (self = [super initWithExperienceId:experienceId kernelServiceDelegate:kernelServiceInstance params:params]) {
    _kernelLinkingDelegate = kernelServiceInstance;
    _initialUrl = params[@"initialUri"];
  }
  return self;
}

#pragma mark - ABI39_0_0RCTEventEmitter methods

- (NSArray<NSString *> *)supportedEvents
{
  return @[ABI39_0_0EXLinkingEventOpenUrl];
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
    ABI39_0_0RCTFatal(ABI39_0_0RCTErrorWithMessage([NSString stringWithFormat:@"Tried to open a deep link to an invalid url: %@", url]));
    return;
  }
  if (_hasListeners) {
    [self sendEventWithName:ABI39_0_0EXLinkingEventOpenUrl body:@{@"url": url.absoluteString}];
  }
}

ABI39_0_0RCT_EXPORT_METHOD(openURL:(NSURL *)URL
                  resolve:(ABI39_0_0RCTPromiseResolveBlock)resolve
                  reject:(ABI39_0_0RCTPromiseRejectBlock)reject)
{
  if ([_kernelLinkingDelegate linkingModule:self shouldOpenExpoUrl:URL]) {
    [_kernelLinkingDelegate linkingModule:self didOpenUrl:URL.absoluteString];
    resolve(@YES);
  } else {
    [ABI39_0_0EXUtil performSynchronouslyOnMainThread:^{
      [ABI39_0_0RCTSharedApplication() openURL:URL options:@{} completionHandler:^(BOOL success) {
        if (success) {
          resolve(nil);
        } else {
          reject(ABI39_0_0RCTErrorUnspecified, [NSString stringWithFormat:@"Unable to open URL: %@", URL], nil);
        }
      }];
    }];
  }
}

ABI39_0_0RCT_EXPORT_METHOD(canOpenURL:(NSURL *)URL
                  resolve:(ABI39_0_0RCTPromiseResolveBlock)resolve
                  reject:(__unused ABI39_0_0RCTPromiseRejectBlock)reject)
{
  __block BOOL canOpen = [_kernelLinkingDelegate linkingModule:self shouldOpenExpoUrl:URL];
  if (!canOpen) {
    [ABI39_0_0EXUtil performSynchronouslyOnMainThread:^{
      canOpen = [ABI39_0_0RCTSharedApplication() canOpenURL:URL];
    }];
  }
  resolve(@(canOpen));
}

ABI39_0_0RCT_EXPORT_METHOD(openSettings:(ABI39_0_0RCTPromiseResolveBlock)resolve
                        reject:(ABI39_0_0RCTPromiseRejectBlock)reject)
{
  [ABI39_0_0EXUtil performSynchronouslyOnMainThread:^{
    NSURL *url = [NSURL URLWithString:UIApplicationOpenSettingsURLString];
    [ABI39_0_0RCTSharedApplication() openURL:url options:@{} completionHandler:^(BOOL success) {
      if (success) {
        resolve(nil);
      } else {
        reject(ABI39_0_0RCTErrorUnspecified, @"Unable to open app settings", nil);
      }
    }];
  }];
}

ABI39_0_0RCT_EXPORT_METHOD(getInitialURL:(ABI39_0_0RCTPromiseResolveBlock)resolve
                  reject:(__unused ABI39_0_0RCTPromiseRejectBlock)reject)
{
  resolve(ABI39_0_0RCTNullIfNil(_initialUrl.absoluteString));
}

@end
