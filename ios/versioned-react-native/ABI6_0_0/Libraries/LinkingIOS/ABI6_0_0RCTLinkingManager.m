/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#import "ABI6_0_0RCTLinkingManager.h"

#import "ABI6_0_0RCTBridge.h"
#import "ABI6_0_0RCTEventDispatcher.h"
#import "ABI6_0_0RCTUtils.h"

NSString *const ABI6_0_0RCTOpenURLNotification = @"ABI6_0_0RCTOpenURLNotification";

@implementation ABI6_0_0RCTLinkingManager

@synthesize bridge = _bridge;

ABI6_0_0RCT_EXPORT_MODULE()

- (instancetype)init
{
  // We're only overriding this to ensure the module gets created at startup
  // TODO (t11106126): Remove once we have more declarative control over module setup.
  return [super init];
}

- (void)setBridge:(ABI6_0_0RCTBridge *)bridge
{
  _bridge = bridge;

  [[NSNotificationCenter defaultCenter] addObserver:self
                                           selector:@selector(handleOpenURLNotification:)
                                               name:ABI6_0_0RCTOpenURLNotification
                                             object:nil];
}

- (NSDictionary<NSString *, id> *)constantsToExport
{
  NSURL *initialURL;

  if (_bridge.launchOptions[UIApplicationLaunchOptionsURLKey]) {
    initialURL = _bridge.launchOptions[UIApplicationLaunchOptionsURLKey];
  } else if (&UIApplicationLaunchOptionsUserActivityDictionaryKey &&
      _bridge.launchOptions[UIApplicationLaunchOptionsUserActivityDictionaryKey]) {
    NSDictionary *userActivityDictionary = _bridge.launchOptions[UIApplicationLaunchOptionsUserActivityDictionaryKey];

    if ([userActivityDictionary[UIApplicationLaunchOptionsUserActivityTypeKey] isEqual:NSUserActivityTypeBrowsingWeb]) {
      initialURL = ((NSUserActivity *)userActivityDictionary[@"UIApplicationLaunchOptionsUserActivityKey"]).webpageURL;
    }
  }

  return @{@"initialURL": ABI6_0_0RCTNullIfNil(initialURL.absoluteString)};
}

- (void)dealloc
{
  [[NSNotificationCenter defaultCenter] removeObserver:self];
}

+ (BOOL)application:(UIApplication *)application
            openURL:(NSURL *)URL
  sourceApplication:(NSString *)sourceApplication
         annotation:(id)annotation
{
  NSDictionary<NSString *, id> *payload = @{@"url": URL.absoluteString};
  [[NSNotificationCenter defaultCenter] postNotificationName:ABI6_0_0RCTOpenURLNotification
                                                      object:self
                                                    userInfo:payload];
  return YES;
}

+ (BOOL)application:(UIApplication *)application
continueUserActivity:(NSUserActivity *)userActivity
  restorationHandler:(void (^)(NSArray *))restorationHandler
{
  if ([userActivity.activityType isEqualToString:NSUserActivityTypeBrowsingWeb]) {
    NSDictionary *payload = @{@"url": userActivity.webpageURL.absoluteString};
    [[NSNotificationCenter defaultCenter] postNotificationName:ABI6_0_0RCTOpenURLNotification
                                                        object:self
                                                      userInfo:payload];
  }
  return YES;
}

- (void)handleOpenURLNotification:(NSNotification *)notification
{
  [_bridge.eventDispatcher sendDeviceEventWithName:@"openURL"
                                              body:notification.userInfo];
}

ABI6_0_0RCT_EXPORT_METHOD(openURL:(NSURL *)URL
                  resolve:(ABI6_0_0RCTPromiseResolveBlock)resolve
                  reject:(__unused ABI6_0_0RCTPromiseRejectBlock)reject)
{
  BOOL opened = [ABI6_0_0RCTSharedApplication() openURL:URL];
  resolve(@(opened));
}

ABI6_0_0RCT_EXPORT_METHOD(canOpenURL:(NSURL *)URL
                  resolve:(ABI6_0_0RCTPromiseResolveBlock)resolve
                  reject:(__unused ABI6_0_0RCTPromiseRejectBlock)reject)
{
  if (ABI6_0_0RCTRunningInAppExtension()) {
    // Technically Today widgets can open urls, but supporting that would require
    // a reference to the NSExtensionContext
    resolve(@NO);
    return;
  }

  // This can be expensive, so we deliberately don't call on main thread
  BOOL canOpen = [ABI6_0_0RCTSharedApplication() canOpenURL:URL];
  resolve(@(canOpen));
}

@end
