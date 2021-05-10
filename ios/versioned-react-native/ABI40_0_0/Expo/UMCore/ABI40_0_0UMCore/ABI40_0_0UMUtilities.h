// Copyright © 2018 650 Industries. All rights reserved.

#import <UIKit/UIKit.h>
#import <ABI40_0_0UMCore/ABI40_0_0UMInternalModule.h>
#import <ABI40_0_0UMCore/ABI40_0_0UMUtilitiesInterface.h>
#import <ABI40_0_0UMCore/ABI40_0_0UMModuleRegistryConsumer.h>

@interface ABI40_0_0UMUtilities : NSObject <ABI40_0_0UMInternalModule, ABI40_0_0UMUtilitiesInterface, ABI40_0_0UMModuleRegistryConsumer>

+ (void)performSynchronouslyOnMainThread:(nonnull void (^)(void))block;
+ (CGFloat)screenScale;
+ (nullable UIColor *)UIColor:(nullable id)json;
+ (nullable NSDate *)NSDate:(nullable id)json;
+ (nonnull NSString *)hexStringWithCGColor:(nonnull CGColorRef)color;

- (nullable UIViewController *)currentViewController;
- (nullable NSDictionary *)launchOptions;

@end
