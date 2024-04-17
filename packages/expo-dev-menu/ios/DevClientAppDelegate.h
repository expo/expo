// Copyright 2015-present 650 Industries. All rights reserved.

#import <React/RCTBridgeDelegate.h>
#if __has_include(<React-RCTAppDelegate/RCTAppDelegate.h>)
#import <React-RCTAppDelegate/RCTAppDelegate.h>
#elif __has_include(<React_RCTAppDelegate/RCTAppDelegate.h>)
// for importing the header from framework, the dash will be transformed to underscore
#import <React_RCTAppDelegate/RCTAppDelegate.h>
#endif

NS_ASSUME_NONNULL_BEGIN

@interface DevClientAppDelegate : RCTAppDelegate

- (void)initRootViewFactory;

#pragma mark - Remove these method when we drop SDK 49

// These methods are backward compatible layer to define nonnull `RCTAppDelegate`,
// which is landed after React Native 0.74:
// https://github.com/facebook/react-native/commit/a7c5c2821c39a7bf653919353897d27d29a64068

- (UIView *)createRootViewWithBridge:(RCTBridge *)bridge
                          moduleName:(NSString *)moduleName
                           initProps:(NSDictionary *)initProps;
- (NSURL *)sourceURLForBridge:(RCTBridge *)bridge;
- (NSArray<id<RCTBridgeModule>> *)extraModulesForBridge:(RCTBridge *)bridge;
- (BOOL)bridge:(RCTBridge *)bridge didNotFindModule:(NSString *)moduleName;


@end

NS_ASSUME_NONNULL_END
