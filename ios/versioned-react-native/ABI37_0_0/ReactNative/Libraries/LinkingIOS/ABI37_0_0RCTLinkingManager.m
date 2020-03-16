/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <ABI37_0_0React/ABI37_0_0RCTLinkingManager.h>

#import <ABI37_0_0React/ABI37_0_0RCTBridge.h>
#import <ABI37_0_0React/ABI37_0_0RCTEventDispatcher.h>
#import <ABI37_0_0React/ABI37_0_0RCTUtils.h>

static NSString *const kOpenURLNotification = @"ABI37_0_0RCTOpenURLNotification";

static void postNotificationWithURL(NSURL *URL, id sender)
{
  NSDictionary<NSString *, id> *payload = @{@"url": URL.absoluteString};
  [[NSNotificationCenter defaultCenter] postNotificationName:kOpenURLNotification
                                                      object:sender
                                                    userInfo:payload];
}

@implementation ABI37_0_0RCTLinkingManager

ABI37_0_0RCT_EXPORT_MODULE()

- (dispatch_queue_t)methodQueue
{
  return dispatch_get_main_queue();
}

- (void)startObserving
{
  [[NSNotificationCenter defaultCenter] addObserver:self
                                           selector:@selector(handleOpenURLNotification:)
                                               name:kOpenURLNotification
                                             object:nil];
}

- (void)stopObserving
{
  [[NSNotificationCenter defaultCenter] removeObserver:self];
}

- (NSArray<NSString *> *)supportedEvents
{
  return @[@"url"];
}

+ (BOOL)application:(UIApplication *)app
            openURL:(NSURL *)URL
            options:(NSDictionary<UIApplicationOpenURLOptionsKey,id> *)options
{
  postNotificationWithURL(URL, self);
  return YES;
}

// Corresponding api deprecated in iOS 9
+ (BOOL)application:(UIApplication *)application
            openURL:(NSURL *)URL
  sourceApplication:(NSString *)sourceApplication
         annotation:(id)annotation
{
  postNotificationWithURL(URL, self);
  return YES;
}

+ (BOOL)application:(UIApplication *)application
continueUserActivity:(NSUserActivity *)userActivity
  restorationHandler:
    #if defined(__IPHONE_OS_VERSION_MAX_ALLOWED) && (__IPHONE_OS_VERSION_MAX_ALLOWED >= 12000) /* __IPHONE_12_0 */
        (nonnull void (^)(NSArray<id<UIUserActivityRestoring>> *_Nullable))restorationHandler {
    #else
        (nonnull void (^)(NSArray *_Nullable))restorationHandler {
    #endif
  if ([userActivity.activityType isEqualToString:NSUserActivityTypeBrowsingWeb]) {
    NSDictionary *payload = @{@"url": userActivity.webpageURL.absoluteString};
    [[NSNotificationCenter defaultCenter] postNotificationName:kOpenURLNotification
                                                        object:self
                                                      userInfo:payload];
  }
  return YES;
}

- (void)handleOpenURLNotification:(NSNotification *)notification
{
  [self sendEventWithName:@"url" body:notification.userInfo];
}

ABI37_0_0RCT_EXPORT_METHOD(openURL:(NSURL *)URL
                  resolve:(ABI37_0_0RCTPromiseResolveBlock)resolve
                  reject:(ABI37_0_0RCTPromiseRejectBlock)reject)
{
  if (@available(iOS 10.0, *)) {
    [ABI37_0_0RCTSharedApplication() openURL:URL options:@{} completionHandler:^(BOOL success) {
      if (success) {
        resolve(@YES);
      } else {
        reject(ABI37_0_0RCTErrorUnspecified, [NSString stringWithFormat:@"Unable to open URL: %@", URL], nil);
      }
    }];
  } else {
#if !TARGET_OS_UIKITFORMAC
    // Note: this branch will never be taken on UIKitForMac
    BOOL opened = [ABI37_0_0RCTSharedApplication() openURL:URL];
    if (opened) {
      resolve(@YES);
    } else {
      reject(ABI37_0_0RCTErrorUnspecified, [NSString stringWithFormat:@"Unable to open URL: %@", URL], nil);
    }
#endif
  }

}

ABI37_0_0RCT_EXPORT_METHOD(canOpenURL:(NSURL *)URL
                  resolve:(ABI37_0_0RCTPromiseResolveBlock)resolve
                  reject:(__unused ABI37_0_0RCTPromiseRejectBlock)reject)
{
  if (ABI37_0_0RCTRunningInAppExtension()) {
    // Technically Today widgets can open urls, but supporting that would require
    // a reference to the NSExtensionContext
    resolve(@NO);
    return;
  }

  // This can be expensive, so we deliberately don't call on main thread
  BOOL canOpen = [ABI37_0_0RCTSharedApplication() canOpenURL:URL];
  NSString *scheme = [URL scheme];
  if (canOpen) {
    resolve(@YES);
  } else if (![[scheme lowercaseString] hasPrefix:@"http"] && ![[scheme lowercaseString] hasPrefix:@"https"]) {
    // On iOS 9 and above canOpenURL returns NO without a helpful error.
    // Check if a custom scheme is being used, and if it exists in LSApplicationQueriesSchemes
    NSArray *querySchemes = [[NSBundle mainBundle] objectForInfoDictionaryKey:@"LSApplicationQueriesSchemes"];
    if (querySchemes != nil && ([querySchemes containsObject:scheme] || [querySchemes containsObject:[scheme lowercaseString]])) {
      resolve(@NO);
    } else {
      reject(ABI37_0_0RCTErrorUnspecified, [NSString stringWithFormat:@"Unable to open URL: %@. Add %@ to LSApplicationQueriesSchemes in your Info.plist.", URL, scheme], nil);
    }
  } else {
    resolve(@NO);
  }
}

ABI37_0_0RCT_EXPORT_METHOD(getInitialURL:(ABI37_0_0RCTPromiseResolveBlock)resolve
                  reject:(__unused ABI37_0_0RCTPromiseRejectBlock)reject)
{
  NSURL *initialURL = nil;
  if (self.bridge.launchOptions[UIApplicationLaunchOptionsURLKey]) {
    initialURL = self.bridge.launchOptions[UIApplicationLaunchOptionsURLKey];
  } else {
    NSDictionary *userActivityDictionary =
      self.bridge.launchOptions[UIApplicationLaunchOptionsUserActivityDictionaryKey];
    if ([userActivityDictionary[UIApplicationLaunchOptionsUserActivityTypeKey] isEqual:NSUserActivityTypeBrowsingWeb]) {
      initialURL = ((NSUserActivity *)userActivityDictionary[@"UIApplicationLaunchOptionsUserActivityKey"]).webpageURL;
    }
  }
  resolve(ABI37_0_0RCTNullIfNil(initialURL.absoluteString));
}

ABI37_0_0RCT_EXPORT_METHOD(openSettings:(ABI37_0_0RCTPromiseResolveBlock)resolve
                  reject:(__unused ABI37_0_0RCTPromiseRejectBlock)reject)
{
  NSURL *url = [NSURL URLWithString:UIApplicationOpenSettingsURLString];
  if (@available(iOS 10.0, *)) {
    [ABI37_0_0RCTSharedApplication() openURL:url options:@{} completionHandler:^(BOOL success) {
      if (success) {
        resolve(nil);
      } else {
        reject(ABI37_0_0RCTErrorUnspecified, @"Unable to open app settings", nil);
      }
    }];
  } else {
#if !TARGET_OS_UIKITFORMAC
   // Note: This branch will never be taken on UIKitForMac
   BOOL opened = [ABI37_0_0RCTSharedApplication() openURL:url];
   if (opened) {
     resolve(nil);
   } else {
     reject(ABI37_0_0RCTErrorUnspecified, @"Unable to open app settings", nil);
   }
#endif
  }
}

@end
