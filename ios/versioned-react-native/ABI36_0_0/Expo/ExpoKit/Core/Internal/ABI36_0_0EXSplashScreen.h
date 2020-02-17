// Copyright 2015-present 650 Industries. All rights reserved.

#import <ABI36_0_0React/ABI36_0_0RCTView.h>
#import <ABI36_0_0React/ABI36_0_0RCTBridgeModule.h>

@interface ABI36_0_0EXSplashScreen : NSObject <ABI36_0_0RCTBridgeModule>

/**
 * This property has to be set before any React Native method is called.
 */
@property (nonatomic, weak) UIViewController *viewController;

@end
