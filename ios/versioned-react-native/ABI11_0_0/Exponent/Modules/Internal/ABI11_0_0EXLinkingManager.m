// Copyright 2015-present 650 Industries. All rights reserved.

#import "ABI11_0_0EXLinkingManager.h"
#import "ABI11_0_0EXUnversioned.h"

#import "ABI11_0_0RCTBridge.h"
#import "ABI11_0_0RCTEventDispatcher.h"
#import "ABI11_0_0RCTUtils.h"

NSString * const ABI11_0_0EXLinkingEventOpenUrl = @"url";

@interface ABI11_0_0EXLinkingManager ()

@property (nonatomic, strong) NSURL *initialUrl;
@property (nonatomic) BOOL hasListeners;

@end

@implementation ABI11_0_0EXLinkingManager

+ (NSString *)moduleName { return @"ABI11_0_0RCTLinkingManager"; }

- (instancetype)initWithInitialUrl:(NSURL *)initialUrl
{
  if (self = [super init]) {
    _initialUrl = initialUrl;
  }
  return self;
}

#pragma mark - ABI11_0_0RCTEventEmitter methods

- (NSArray<NSString *> *)supportedEvents
{
  return @[ABI11_0_0EXLinkingEventOpenUrl];
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
    ABI11_0_0RCTFatal(ABI11_0_0RCTErrorWithMessage([NSString stringWithFormat:@"Tried to open a deep link to an invalid url: %@", url]));
    return;
  }
  if (_hasListeners) {
    [self sendEventWithName:ABI11_0_0EXLinkingEventOpenUrl body:@{@"url": url.absoluteString}];
  }
}

ABI11_0_0RCT_EXPORT_METHOD(openURL:(NSURL *)URL
                  resolve:(ABI11_0_0RCTPromiseResolveBlock)resolve
                  reject:(ABI11_0_0RCTPromiseRejectBlock)reject)
{
  if ([self _isExponentUrl:URL]) {
    // notify the kernel so it can route this url
    [[NSNotificationCenter defaultCenter] postNotificationName:@"EXKernelOpenUrlNotification"
                                                        object:nil
                                                      userInfo:@{
                                                                 @"bridge": self.bridge,
                                                                 @"url": URL.absoluteString,
                                                                 }];
    resolve(@YES);
  } else {
    BOOL opened = [ABI11_0_0RCTSharedApplication() openURL:URL];
    if (opened) {
      resolve(nil);
    } else {
      reject(ABI11_0_0RCTErrorUnspecified, [NSString stringWithFormat:@"Unable to open URL: %@", URL], nil);
    }
  }
}

ABI11_0_0RCT_EXPORT_METHOD(canOpenURL:(NSURL *)URL
                  resolve:(ABI11_0_0RCTPromiseResolveBlock)resolve
                  reject:(__unused ABI11_0_0RCTPromiseRejectBlock)reject)
{
  BOOL canOpen = [self _isExponentUrl:URL];
  if (!canOpen) {
    canOpen = [ABI11_0_0RCTSharedApplication() canOpenURL:URL];
  }
  resolve(@(canOpen));
}

ABI11_0_0RCT_EXPORT_METHOD(getInitialURL:(ABI11_0_0RCTPromiseResolveBlock)resolve
                  reject:(__unused ABI11_0_0RCTPromiseRejectBlock)reject)
{
  resolve(ABI11_0_0RCTNullIfNil(_initialUrl.absoluteString));
}

# pragma mark - internal

- (BOOL)_isExponentUrl: (NSURL *)url
{
  // we don't need to explicitly include a shell app custom URL scheme here
  // because the default iOS linking behavior will still hand those links back to Exponent.

  NSURLComponents *components = [NSURLComponents componentsWithURL:url resolvingAgainstBaseURL:YES];
  if (components) {
    return ([components.scheme isEqualToString:@"exp"] ||
            [components.scheme isEqualToString:@"exps"] ||
            [components.host isEqualToString:@"exp.host"] ||
            [components.host hasSuffix:@".exp.host"]
            );
  }
  return NO;
}

@end
