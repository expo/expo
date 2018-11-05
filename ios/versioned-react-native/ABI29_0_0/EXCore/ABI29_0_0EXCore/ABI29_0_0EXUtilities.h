// Copyright © 2018 650 Industries. All rights reserved.

#import <UIKit/UIKit.h>
#import <ABI29_0_0EXCore/ABI29_0_0EXInternalModule.h>
#import <ABI29_0_0EXCore/ABI29_0_0EXUtilitiesInterface.h>
#import <ABI29_0_0EXCore/ABI29_0_0EXModuleRegistryConsumer.h>

@interface ABI29_0_0EXUtilities : NSObject <ABI29_0_0EXInternalModule, ABI29_0_0EXUtilitiesInterface, ABI29_0_0EXModuleRegistryConsumer>

+ (void)performSynchronouslyOnMainThread:(void (^)(void))block;
+ (CGFloat)screenScale;

- (UIViewController *)currentViewController;

@end
