// Copyright © 2018 650 Industries. All rights reserved.

#import <UIKit/UIKit.h>
#import <ABI33_0_0UMCore/ABI33_0_0UMInternalModule.h>
#import <ABI33_0_0UMCore/ABI33_0_0UMUtilitiesInterface.h>
#import <ABI33_0_0UMCore/ABI33_0_0UMModuleRegistryConsumer.h>

@interface ABI33_0_0UMUtilities : NSObject <ABI33_0_0UMInternalModule, ABI33_0_0UMUtilitiesInterface, ABI33_0_0UMModuleRegistryConsumer>

+ (void)performSynchronouslyOnMainThread:(void (^)(void))block;
+ (CGFloat)screenScale;
+ (UIColor *)UIColor:(id)json;
+ (NSDate *)NSDate:(id)json;
+ (NSString *)hexStringWithCGColor:(CGColorRef)color;

- (UIViewController *)currentViewController;
- (nullable NSDictionary *)launchOptions;

@end
