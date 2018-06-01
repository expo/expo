// Copyright 2016-present 650 Industries. All rights reserved.

#import <UIKit/UIKit.h>
#import "ABI28_0_0EXScopedBridgeModule.h"
#import "ABI28_0_0EXScopedModuleRegistry.h"

@interface ABI28_0_0EXUtil : ABI28_0_0EXScopedBridgeModule

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

@protocol ABI28_0_0EXUtilService

- (UIViewController *)currentViewController;

@end

ABI28_0_0EX_DECLARE_SCOPED_MODULE_GETTER(ABI28_0_0EXUtil, util)
