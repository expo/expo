// Copyright 2016-present 650 Industries. All rights reserved.

#import <UIKit/UIKit.h>
#import "ABI31_0_0EXScopedBridgeModule.h"
#import "ABI31_0_0EXScopedModuleRegistry.h"

@interface ABI31_0_0EXUtil : ABI31_0_0EXScopedBridgeModule

+ (NSString *)escapedResourceName:(NSString *)name;
+ (void)performSynchronouslyOnMainThread:(void (^)(void))block;
+ (NSString *)hexStringWithCGColor:(CGColorRef)color;
+ (UIColor *)colorWithRGB:(unsigned int)rgbValue;

/**
 *  Expects @"#ABCDEF"
 */
+ (UIColor *)colorWithHexString:(NSString *)hexString;

- (UIViewController *)currentViewController;

@end

@protocol ABI31_0_0EXUtilService

- (UIViewController *)currentViewController;
- (nullable NSDictionary *)launchOptions;

@end

ABI31_0_0EX_DECLARE_SCOPED_MODULE_GETTER(ABI31_0_0EXUtil, util)
