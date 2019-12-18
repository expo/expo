//  Copyright © 2019-present 650 Industries. All rights reserved.

#import <Foundation/Foundation.h>
#import <UMCore/UMSingletonModule.h>

@interface EXScreenOrientationRegistry : UMSingletonModule

- (UIInterfaceOrientation)currentOrientation;
- (UIInterfaceOrientationMask)currentOrientationMask;
- (UIInterfaceOrientationMask)foregroundedOrientationMask;

- (void)setMask:(UIInterfaceOrientationMask)mask forModule:(id)module;
- (void)registerModuleToReceiveNotification:(id)module;
- (void)traitCollectionsDidChange:(UITraitCollection *)traitCollection;

- (void)moduleDidForeground:(id)module;
- (void)moduleDidBackground:(id)module;
- (void)moduleWillDeallocate:(id)module;

@end
