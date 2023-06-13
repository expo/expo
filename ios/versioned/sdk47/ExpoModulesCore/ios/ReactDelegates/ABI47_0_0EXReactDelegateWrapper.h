// Copyright 2018-present 650 Industries. All rights reserved.

#import <UIKit/UIKit.h>
#import <ABI47_0_0React/ABI47_0_0RCTBridge.h>
#import <ABI47_0_0React/ABI47_0_0RCTRootView.h>

NS_ASSUME_NONNULL_BEGIN

/**
 A wrapper of `ExpoReactDelegate` for Objective-C bindings.
 */
@interface ABI47_0_0EXReactDelegateWrapper : NSObject

- (ABI47_0_0RCTBridge *)createBridgeWithDelegate:(id<ABI47_0_0RCTBridgeDelegate>)delegate
                          launchOptions:(nullable NSDictionary *)launchOptions;

- (ABI47_0_0RCTRootView *)createRootViewWithBridge:(ABI47_0_0RCTBridge *)bridge
                               moduleName:(NSString *)moduleName
                        initialProperties:(nullable NSDictionary *)initialProperties;

- (UIViewController *)createRootViewController;

@end

NS_ASSUME_NONNULL_END
