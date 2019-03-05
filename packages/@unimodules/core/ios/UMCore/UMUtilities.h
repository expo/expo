// Copyright © 2018 650 Industries. All rights reserved.

#import <UIKit/UIKit.h>
#import <UMCore/UMInternalModule.h>
#import <UMCore/UMUtilitiesInterface.h>
#import <UMCore/UMModuleRegistryConsumer.h>

@interface UMUtilities : NSObject <UMInternalModule, UMUtilitiesInterface, UMModuleRegistryConsumer>

+ (void)performSynchronouslyOnMainThread:(void (^)(void))block;
+ (CGFloat)screenScale;
+ (UIColor *)UIColor:(id)json;
+ (NSDate *)NSDate:(id)json;
+ (NSString *)hexStringWithCGColor:(CGColorRef)color;

- (UIViewController *)currentViewController;
- (nullable NSDictionary *)launchOptions;

@end
