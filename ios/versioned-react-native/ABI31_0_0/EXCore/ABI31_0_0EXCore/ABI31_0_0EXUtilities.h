// Copyright © 2018 650 Industries. All rights reserved.

#import <UIKit/UIKit.h>
#import <ABI31_0_0EXCore/ABI31_0_0EXInternalModule.h>
#import <ABI31_0_0EXCore/ABI31_0_0EXUtilitiesInterface.h>
#import <ABI31_0_0EXCore/ABI31_0_0EXModuleRegistryConsumer.h>

@interface ABI31_0_0EXUtilities : NSObject <ABI31_0_0EXInternalModule, ABI31_0_0EXUtilitiesInterface, ABI31_0_0EXModuleRegistryConsumer>

+ (void)performSynchronouslyOnMainThread:(void (^)(void))block;
+ (CGFloat)screenScale;

- (UIViewController *)currentViewController;
- (nullable NSDictionary *)launchOptions;

@end
