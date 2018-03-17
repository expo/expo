// Copyright 2016-present 650 Industries. All rights reserved.

#import <UIKit/UIKit.h>

@interface ABI26_0_0EXUtil : NSObject

+ (NSString *)escapedResourceName:(NSString *)name;
+ (void)performSynchronouslyOnMainThread:(void (^)(void))block;
+ (NSString *)hexStringWithCGColor:(CGColorRef)color;
+ (UIColor *)colorWithRGB:(unsigned int)rgbValue;

/**
 *  Expects @"#ABCDEF"
 */
+ (UIColor *)colorWithHexString:(NSString *)hexString;

@end
