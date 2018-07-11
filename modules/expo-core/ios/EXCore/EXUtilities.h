// Copyright © 2018 650 Industries. All rights reserved.

#import <UIKit/UIKit.h>
#import <EXCore/EXInternalModule.h>
#import <EXCore/EXUtilitiesInterface.h>
#import <EXCore/EXModuleRegistryConsumer.h>

@protocol EXUtilitiesInterface

- (UIViewController *)currentViewController;

@end

@interface EXUtilities : NSObject <EXInternalModule, EXUtilitiesInterface, EXModuleRegistryConsumer>

+ (void)performSynchronouslyOnMainThread:(void (^)(void))block;
+ (CGFloat)screenScale;

- (UIViewController *)currentViewController;

@end
