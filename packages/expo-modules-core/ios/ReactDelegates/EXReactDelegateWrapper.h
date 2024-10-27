// Copyright 2018-present 650 Industries. All rights reserved.

#import <ExpoModulesCore/Platform.h>

NS_ASSUME_NONNULL_BEGIN

/**
 A wrapper of `ExpoReactDelegate` for Objective-C bindings.
 */
@interface EXReactDelegateWrapper : NSObject

- (UIView *)createReactRootView:(NSString *)moduleName
              initialProperties:(nullable NSDictionary *)initialProperties
                  launchOptions:(nullable NSDictionary *)launchOptions;

- (NSURL *)bundleURL;

- (UIViewController *)createRootViewController;

@end

NS_ASSUME_NONNULL_END
