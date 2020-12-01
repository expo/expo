//  Copyright © 2019-present 650 Industries. All rights reserved.

#import <UIKit/UIKit.h>
#import <Foundation/Foundation.h>
#import <UMCore/UMSingletonModule.h>

NS_ASSUME_NONNULL_BEGIN

@protocol EXOrientationListener <NSObject>

- (void)screenOrientationDidChange:(UIInterfaceOrientation)orientation;

@end

@protocol EXScreenOrientationEventEmitter <NSObject>

- (void)unregisterModuleFromReceivingNotification:(id<EXOrientationListener>)module;
- (void)registerModuleToReceiveNotification:(id<EXOrientationListener>)module;

@end

@protocol EXScreenOrientationRegistry <NSObject>

- (UIInterfaceOrientation)currentOrientation;
- (UIInterfaceOrientationMask)currentOrientationMask;
- (UITraitCollection *)currentTrailCollection;

- (void)setMask:(UIInterfaceOrientationMask)mask forModule:(id)module;

- (void)moduleDidForeground:(id)module;
- (void)moduleDidBackground:(id)module;
- (void)moduleWillDeallocate:(id)module;

@end

@interface EXScreenOrientationRegistry : UMSingletonModule <UIApplicationDelegate, EXScreenOrientationEventEmitter, EXScreenOrientationRegistry>

- (BOOL)application:(UIApplication *)application didFinishLaunchingWithOptions:(nullable NSDictionary<UIApplicationLaunchOptionsKey,id> *)launchOptions;

- (UIInterfaceOrientationMask)requiredOrientationMask;
- (void)traitCollectionDidChangeTo:(UITraitCollection *)traitCollection;

@end

NS_ASSUME_NONNULL_END
