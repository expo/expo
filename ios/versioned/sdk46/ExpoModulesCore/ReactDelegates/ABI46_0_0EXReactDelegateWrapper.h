// Copyright 2018-present 650 Industries. All rights reserved.

#import <UIKit/UIKit.h>
#import <ABI46_0_0React/ABI46_0_0RCTBridge.h>
#import <ABI46_0_0React/ABI46_0_0RCTRootView.h>

NS_ASSUME_NONNULL_BEGIN

/**
 A wrapper of `ExpoReactDelegate` for Objective-C bindings.
 */
@interface ABI46_0_0EXReactDelegateWrapper : NSObject

- (ABI46_0_0RCTBridge *)createBridgeWithDelegate:(id<ABI46_0_0RCTBridgeDelegate>)delegate
                          launchOptions:(nullable NSDictionary *)launchOptions;

- (ABI46_0_0RCTRootView *)createRootViewWithBridge:(ABI46_0_0RCTBridge *)bridge
                               moduleName:(NSString *)moduleName
                        initialProperties:(nullable NSDictionary *)initialProperties;

- (UIViewController *)createRootViewController;

@end

NS_ASSUME_NONNULL_END
