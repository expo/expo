// Copyright © 2018 650 Industries. All rights reserved.

#import <Foundation/Foundation.h>
#import <UIKit/UIKit.h>

#import <ABI43_0_0ExpoModulesCore/ABI43_0_0EXInternalModule.h>
#import <ABI43_0_0ExpoModulesCore/ABI43_0_0EXUtilitiesInterface.h>
#import <ABI43_0_0ExpoModulesCore/ABI43_0_0EXModuleRegistryConsumer.h>

NS_ASSUME_NONNULL_BEGIN

@interface ABI43_0_0EXUtilities : NSObject <ABI43_0_0EXInternalModule, ABI43_0_0EXUtilitiesInterface, ABI43_0_0EXModuleRegistryConsumer>

+ (void)performSynchronouslyOnMainThread:(nonnull void (^)(void))block;
+ (CGFloat)screenScale;
+ (nullable UIColor *)UIColor:(nullable id)json;
+ (nullable NSDate *)NSDate:(nullable id)json;
+ (nonnull NSString *)hexStringWithCGColor:(nonnull CGColorRef)color;

- (nullable UIViewController *)currentViewController;
- (nullable NSDictionary *)launchOptions;

@end

NS_ASSUME_NONNULL_END
