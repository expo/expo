//  Copyright © 2019-present 650 Industries. All rights reserved.

#import <Foundation/Foundation.h>
#import <UMCore/UMSingletonModule.h>

@protocol EXScreenOrientationListener <NSObject>

- (void)screenOrientationDidChange:(UIInterfaceOrientation)orientation;

@end

@protocol EXScreenOrientationEventsEmitter <NSObject>

- (void)unregisterModuleFromReceivingNotification:(id<EXScreenOrientationListener>)module;
- (void)registerModuleToReceiveNotification:(id<EXScreenOrientationListener>)module;

@end

@protocol EXScreenOrientationConsumer <NSObject>

- (UIInterfaceOrientation)currentOrientation;
- (UIInterfaceOrientationMask)currentOrientationMask;

- (void)setMask:(UIInterfaceOrientationMask)mask forModule:(id)module;

- (void)moduleDidForeground:(id)module;
- (void)moduleDidBackground:(id)module;
- (void)moduleWillDeallocate:(id)module;

@end

@protocol EXScreenOrientationRegistryController <NSObject>

- (UIInterfaceOrientationMask)requiredOrientationMask;
- (void)traitCollectionDidChangeTo:(UITraitCollection *)traitCollection;

@end

@interface EXScreenOrientationRegistry : UMSingletonModule <EXScreenOrientationEventsEmitter, EXScreenOrientationConsumer, EXScreenOrientationRegistryController>

@end
