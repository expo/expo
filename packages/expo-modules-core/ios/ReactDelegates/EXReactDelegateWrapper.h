// Copyright 2018-present 650 Industries. All rights reserved.

#import <UIKit/UIKit.h>
#import <React/RCTBridge.h>
#import <React/RCTRootView.h>

NS_ASSUME_NONNULL_BEGIN

/**
 A wrapper of `ExpoReactDelegate` for Objective-C bindings.
 */
@interface EXReactDelegateWrapper : NSObject

- (RCTBridge *)createBridgeWithDelegate:(id<RCTBridgeDelegate>)delegate
                          launchOptions:(nullable NSDictionary *)launchOptions;

- (RCTRootView *)createRootViewWithBridge:(RCTBridge *)bridge
                               moduleName:(NSString *)moduleName
                        initialProperties:(nullable NSDictionary *)initialProperties;

- (UIViewController *)createRootViewController;

@end

NS_ASSUME_NONNULL_END
