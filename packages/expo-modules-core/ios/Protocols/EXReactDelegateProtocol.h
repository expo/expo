// Copyright 2024-present 650 Industries. All rights reserved.

#import <Foundation/Foundation.h>
#import <ExpoModulesCore/Platform.h>

NS_ASSUME_NONNULL_BEGIN

/**
 Protocol defining the interface for ExpoReactDelegate that can be used from Objective-C
 without importing Swift.h, breaking the ObjC → Swift → ObjC cyclic dependency.
 */
@protocol EXReactDelegateProtocol <NSObject>

/**
 Creates a React root view with the given module name and properties.
 */
- (UIView *)createReactRootViewWithModuleName:(NSString *)moduleName
                            initialProperties:(nullable NSDictionary<NSString *, id> *)initialProperties
                                launchOptions:(nullable NSDictionary<UIApplicationLaunchOptionsKey, id> *)launchOptions;

/**
 Returns the bundle URL for the React Native bundle.
 */
- (nullable NSURL *)bundleURL;

/**
 Creates the root view controller.
 */
- (UIViewController *)createRootViewController;

@end

NS_ASSUME_NONNULL_END
