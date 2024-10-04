//  Copyright © 2019-present 650 Industries. All rights reserved.

#import <UIKit/UIKit.h>
#import <Foundation/Foundation.h>
#import <ABI42_0_0UMCore/ABI42_0_0UMSingletonModule.h>

NS_ASSUME_NONNULL_BEGIN

@protocol ABI42_0_0EXOrientationListener <NSObject>

- (void)screenOrientationDidChange:(UIInterfaceOrientation)orientation;

@end

@protocol ABI42_0_0EXScreenOrientationEventEmitter <NSObject>

- (void)unregisterModuleFromReceivingNotification:(id<ABI42_0_0EXOrientationListener>)module;
- (void)registerModuleToReceiveNotification:(id<ABI42_0_0EXOrientationListener>)module;

@end

@protocol ABI42_0_0EXScreenOrientationRegistry <NSObject>

- (UIInterfaceOrientation)currentOrientation;
- (UIInterfaceOrientationMask)currentOrientationMask;
- (UITraitCollection *)currentTrailCollection;

- (void)setMask:(UIInterfaceOrientationMask)mask forModule:(id)module;

- (void)moduleDidForeground:(id)module;
- (void)moduleDidBackground:(id)module;
- (void)moduleWillDeallocate:(id)module;

@end

@interface ABI42_0_0EXScreenOrientationRegistry : ABI42_0_0UMSingletonModule <UIApplicationDelegate, ABI42_0_0EXScreenOrientationEventEmitter, ABI42_0_0EXScreenOrientationRegistry>

- (BOOL)application:(UIApplication *)application didFinishLaunchingWithOptions:(nullable NSDictionary<UIApplicationLaunchOptionsKey,id> *)launchOptions;

- (UIInterfaceOrientationMask)requiredOrientationMask;
- (void)traitCollectionDidChangeTo:(UITraitCollection *)traitCollection;

@end

NS_ASSUME_NONNULL_END
