// Copyright © 2018 650 Industries. All rights reserved.

#import <Foundation/Foundation.h>
#import <UIKit/UIKit.h>

#import <ExpoModulesCore/EXInternalModule.h>
#import <ExpoModulesCore/EXUtilitiesInterface.h>
#import <ExpoModulesCore/EXModuleRegistryConsumer.h>

NS_ASSUME_NONNULL_BEGIN

@interface EXUtilities : NSObject <EXInternalModule, EXUtilitiesInterface, EXModuleRegistryConsumer>

+ (void)performSynchronouslyOnMainThread:(nonnull void (^)(void))block;
+ (CGFloat)screenScale;
+ (nullable UIColor *)UIColor:(nullable id)json;
+ (nullable NSDate *)NSDate:(nullable id)json;
+ (nonnull NSString *)hexStringWithCGColor:(nonnull CGColorRef)color;

- (nullable UIViewController *)currentViewController;
- (nullable NSDictionary *)launchOptions;

@end

NS_ASSUME_NONNULL_END
