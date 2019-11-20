// Copyright © 2018 650 Industries. All rights reserved.

#import <UIKit/UIKit.h>
#import <UMCore/UMInternalModule.h>
#import <UMCore/UMUtilitiesInterface.h>
#import <UMCore/UMModuleRegistryConsumer.h>

@interface UMUtilities : NSObject <UMInternalModule, UMUtilitiesInterface, UMModuleRegistryConsumer>

+ (void)performSynchronouslyOnMainThread:(nonnull void (^)(void))block;
+ (CGFloat)screenScale;
+ (nullable UIColor *)UIColor:(nullable id)json;
+ (nullable NSDate *)NSDate:(nullable id)json;
+ (nonnull NSString *)hexStringWithCGColor:(nonnull CGColorRef)color;

- (nullable UIViewController *)currentViewController;
- (nullable NSDictionary *)launchOptions;

@end
