// Copyright 2015-present 650 Industries. All rights reserved.

#import "ABI7_0_0EXLinkingManager.h"

#import "ABI7_0_0RCTBridge.h"
#import "ABI7_0_0RCTEventDispatcher.h"
#import "ABI7_0_0RCTUtils.h"

NSString * const ABI7_0_0EXLinkingEventOpenUrl = @"openURL";

@interface ABI7_0_0EXLinkingManager ()

@property (nonatomic, strong) NSURL *initialUrl;

@end

@implementation ABI7_0_0EXLinkingManager

@synthesize bridge = _bridge;

+ (NSString *)moduleName { return @"ABI7_0_0RCTLinkingManager"; }

- (instancetype)initWithInitialUrl:(NSURL *)initialUrl
{
  if (self = [super init]) {
    _initialUrl = initialUrl;
  }
  return self;
}

- (void)setBridge:(ABI7_0_0RCTBridge *)bridge
{
  _bridge = bridge;
}

- (NSDictionary<NSString *, id> *)constantsToExport
{
  return @{@"initialURL": ABI7_0_0RCTNullIfNil(_initialUrl.absoluteString)};
}

- (void)dispatchOpenUrlEvent:(NSURL *)url
{
  [_bridge.eventDispatcher sendDeviceEventWithName:ABI7_0_0EXLinkingEventOpenUrl
                                              body:@{@"url": url.absoluteString}];
}

ABI7_0_0RCT_EXPORT_METHOD(openURL:(NSURL *)URL
                  resolve:(ABI7_0_0RCTPromiseResolveBlock)resolve
                  reject:(__unused ABI7_0_0RCTPromiseRejectBlock)reject)
{
  if ([self _isExponentUrl:URL]) {
    // notify the kernel so it can route this url
    [[NSNotificationCenter defaultCenter] postNotificationName:@"EXKernelOpenUrlNotification"
                                                        object:nil
                                                      userInfo:@{
                                                                 @"bridge": _bridge,
                                                                 @"url": URL.absoluteString,
                                                                 }];
    resolve(@YES);
  } else {
    BOOL opened = [[UIApplication sharedApplication] openURL:URL];
    resolve(@(opened));
  }
}

ABI7_0_0RCT_EXPORT_METHOD(canOpenURL:(NSURL *)URL
                  resolve:(ABI7_0_0RCTPromiseResolveBlock)resolve
                  reject:(__unused ABI7_0_0RCTPromiseRejectBlock)reject)
{
  BOOL canOpen = [self _isExponentUrl:URL];
  if (!canOpen) {
    canOpen = [[UIApplication sharedApplication] canOpenURL:URL];
  }
  resolve(@(canOpen));
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
