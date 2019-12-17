//  Copyright © 2019-present 650 Industries. All rights reserved.

#import <Foundation/Foundation.h>
#import <UMCore/UMSingletonModule.h>

@interface EXScreenOrientationRegistry : UMSingletonModule

- (void)setMask:(UIInterfaceOrientationMask)mask forModule:(id)module;
- (UIInterfaceOrientationMask)currentOrientationMask;
- (void)moduleDidForeground:(id)module;
- (void)moduleWillDeallocate:(id)module;

@end
