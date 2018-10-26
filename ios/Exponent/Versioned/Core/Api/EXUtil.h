// Copyright 2016-present 650 Industries. All rights reserved.

#import <UIKit/UIKit.h>
#import "EXScopedBridgeModule.h"
#import "EXScopedModuleRegistry.h"

@interface EXUtil : EXScopedBridgeModule

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

@protocol EXUtilService

- (UIViewController *)currentViewController;
- (nullable NSDictionary *)launchOptions;

@end

EX_DECLARE_SCOPED_MODULE_GETTER(EXUtil, util)
