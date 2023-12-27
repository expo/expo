// Copyright 2016-present 650 Industries. All rights reserved.

#import <UIKit/UIKit.h>
#import "EXScopedBridgeModule.h"
#import "EXScopedModuleRegistry.h"

@interface EXUtil : EXScopedBridgeModule

+ (nullable NSString *)escapedResourceName:(nullable NSString *)name;
+ (void)performSynchronouslyOnMainThread:(nonnull void (^)(void))block;
+ (nonnull NSString *)hexStringWithCGColor:(nullable CGColorRef)color;
+ (nonnull UIColor *)colorWithRGB:(unsigned int)rgbValue;

/**
 *  Expects @"#ABCDEF"
 */
+ (nullable UIColor *)colorWithHexString:(nullable NSString *)hexString;

- (nullable UIViewController *)currentViewController;

@end

@protocol EXUtilService

- (nullable UIViewController *)currentViewController;
- (nullable NSDictionary *)launchOptions;

@end

EX_DECLARE_SCOPED_MODULE_GETTER(EXUtil, util)
