// Copyright 2016-present 650 Industries. All rights reserved.

#import <UIKit/UIKit.h>
#import "ABI33_0_0EXScopedBridgeModule.h"
#import "ABI33_0_0EXScopedModuleRegistry.h"

@interface ABI33_0_0EXUtil : ABI33_0_0EXScopedBridgeModule

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

@protocol ABI33_0_0EXUtilService

- (UIViewController *)currentViewController;
- (nullable NSDictionary *)launchOptions;

@end

ABI33_0_0EX_DECLARE_SCOPED_MODULE_GETTER(ABI33_0_0EXUtil, util)
