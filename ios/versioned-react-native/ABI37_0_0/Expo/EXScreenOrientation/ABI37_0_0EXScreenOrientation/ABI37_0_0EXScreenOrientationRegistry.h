//  Copyright © 2019-present 650 Industries. All rights reserved.

#import <Foundation/Foundation.h>
#import <ABI37_0_0UMCore/ABI37_0_0UMSingletonModule.h>

@protocol ABI37_0_0EXOrientationListener <NSObject>

- (void)screenOrientationDidChange:(UIInterfaceOrientation)orientation;

@end

@protocol ABI37_0_0EXScreenOrientationEventEmitter <NSObject>

- (void)unregisterModuleFromReceivingNotification:(id<ABI37_0_0EXOrientationListener>)module;
- (void)registerModuleToReceiveNotification:(id<ABI37_0_0EXOrientationListener>)module;

@end

@protocol ABI37_0_0EXScreenOrientationRegistry <NSObject>

- (UIInterfaceOrientation)currentOrientation;
- (UIInterfaceOrientationMask)currentOrientationMask;
- (UITraitCollection *)currentTrailCollection;

- (void)setMask:(UIInterfaceOrientationMask)mask forModule:(id)module;

- (void)moduleDidForeground:(id)module;
- (void)moduleDidBackground:(id)module;
- (void)moduleWillDeallocate:(id)module;

@end

@interface ABI37_0_0EXScreenOrientationRegistry : ABI37_0_0UMSingletonModule <ABI37_0_0EXScreenOrientationEventEmitter, ABI37_0_0EXScreenOrientationRegistry>

- (UIInterfaceOrientationMask)requiredOrientationMask;
- (void)traitCollectionDidChangeTo:(UITraitCollection *)traitCollection;

@end
