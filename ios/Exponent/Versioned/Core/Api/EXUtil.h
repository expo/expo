// Copyright 2016-present 650 Industries. All rights reserved.

#import "EXScopedBridgeModule.h"

@protocol EXUtilScopedModuleDelegate

- (void)utilModuleDidSelectReload:(id)scopedUtilModule;

@end

@interface EXUtil : EXScopedBridgeModule

+ (NSString *)escapedResourceName:(NSString *)name;
+ (void)performSynchronouslyOnMainThread:(void (^)(void))block;
+ (NSString *)hexStringWithCGColor:(CGColorRef)color;
+ (UIColor *)colorWithRGB:(unsigned int)rgbValue;

/**
 *  Expects @"#ABCDEF"
 */
+ (UIColor *)colorWithHexString:(NSString *)hexString;

@end
