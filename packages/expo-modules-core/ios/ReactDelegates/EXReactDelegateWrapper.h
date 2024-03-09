// Copyright 2018-present 650 Industries. All rights reserved.

#import <ExpoModulesCore/Platform.h>
#import <ExpoModulesCore/EXReactHostWrapper.h>

NS_ASSUME_NONNULL_BEGIN

@class RCTBridge;
@class RCTHost;

/**
 A wrapper of `ExpoReactDelegate` for Objective-C bindings.
 */
@interface EXReactDelegateWrapper : NSObject

- (EXReactHostWrapper *)createReactHostWithBundleURL:(nullable NSURL *)bundleURL
                                       launchOptions:(nullable NSDictionary *)launchOptions;

- (UIView *)createRootViewWithBridge:(RCTBridge *)bridge
                          moduleName:(NSString *)moduleName
                   initialProperties:(nullable NSDictionary *)initialProperties;

- (UIView *)createSurfaceViewWithReactHost:(RCTHost *)reactHost
                                moduleName:(NSString *)moduleName
                         initialProperties:(nullable NSDictionary *)initialProperties;

- (UIViewController *)createRootViewController;

@end

NS_ASSUME_NONNULL_END
