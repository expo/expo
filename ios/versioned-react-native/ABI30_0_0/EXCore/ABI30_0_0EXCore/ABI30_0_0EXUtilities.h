// Copyright © 2018 650 Industries. All rights reserved.

#import <UIKit/UIKit.h>
#import <ABI30_0_0EXCore/ABI30_0_0EXInternalModule.h>
#import <ABI30_0_0EXCore/ABI30_0_0EXUtilitiesInterface.h>
#import <ABI30_0_0EXCore/ABI30_0_0EXModuleRegistryConsumer.h>

@interface ABI30_0_0EXUtilities : NSObject <ABI30_0_0EXInternalModule, ABI30_0_0EXUtilitiesInterface, ABI30_0_0EXModuleRegistryConsumer>

+ (void)performSynchronouslyOnMainThread:(void (^)(void))block;
+ (CGFloat)screenScale;

- (UIViewController *)currentViewController;

@end
