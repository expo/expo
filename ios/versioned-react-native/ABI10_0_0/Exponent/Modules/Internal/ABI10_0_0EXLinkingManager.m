// Copyright 2015-present 650 Industries. All rights reserved.

#import "ABI10_0_0EXLinkingManager.h"

#import "ABI10_0_0RCTBridge.h"
#import "ABI10_0_0RCTEventDispatcher.h"
#import "ABI10_0_0RCTUtils.h"

NSString * const ABI10_0_0EXLinkingEventOpenUrl = @"url";

@interface ABI10_0_0EXLinkingManager ()

@property (nonatomic, strong) NSURL *initialUrl;
@property (nonatomic) BOOL hasListeners;

@end

@implementation ABI10_0_0EXLinkingManager

+ (NSString *)moduleName { return @"ABI10_0_0RCTLinkingManager"; }

- (instancetype)initWithInitialUrl:(NSURL *)initialUrl
{
  if (self = [super init]) {
    _initialUrl = initialUrl;
  }
  return self;
}

#pragma mark - ABI10_0_0RCTEventEmitter methods

- (NSArray<NSString *> *)supportedEvents
{
  return @[ABI10_0_0EXLinkingEventOpenUrl];
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
  if (_hasListeners) {
    [self sendEventWithName:ABI10_0_0EXLinkingEventOpenUrl body:@{@"url": url.absoluteString}];
  }
}

ABI10_0_0RCT_EXPORT_METHOD(openURL:(NSURL *)URL
                  resolve:(ABI10_0_0RCTPromiseResolveBlock)resolve
                  reject:(ABI10_0_0RCTPromiseRejectBlock)reject)
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
    BOOL opened = [ABI10_0_0RCTSharedApplication() openURL:URL];
    if (opened) {
      resolve(nil);
    } else {
      reject(ABI10_0_0RCTErrorUnspecified, [NSString stringWithFormat:@"Unable to open URL: %@", URL], nil);
    }
  }
}

ABI10_0_0RCT_EXPORT_METHOD(canOpenURL:(NSURL *)URL
                  resolve:(ABI10_0_0RCTPromiseResolveBlock)resolve
                  reject:(__unused ABI10_0_0RCTPromiseRejectBlock)reject)
{
  BOOL canOpen = [self _isExponentUrl:URL];
  if (!canOpen) {
    canOpen = [ABI10_0_0RCTSharedApplication() canOpenURL:URL];
  }
  resolve(@(canOpen));
}

ABI10_0_0RCT_EXPORT_METHOD(getInitialURL:(ABI10_0_0RCTPromiseResolveBlock)resolve
                  reject:(__unused ABI10_0_0RCTPromiseRejectBlock)reject)
{
  resolve(ABI10_0_0RCTNullIfNil(_initialUrl.absoluteString));
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
