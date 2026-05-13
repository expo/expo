// Copyright 2016-present 650 Industries. All rights reserved.

#import <UIKit/UIKit.h>

@interface EXUtil : NSObject

+ (nullable NSString *)escapedResourceName:(nullable NSString *)name;
+ (void)performSynchronouslyOnMainThread:(nonnull void (^)(void))block;
+ (nonnull NSString *)hexStringWithCGColor:(nullable CGColorRef)color;
+ (nonnull UIColor *)colorWithRGB:(unsigned int)rgbValue;
+ (BOOL)isExpoHostedUrl:(NSURL *)url;
+ (BOOL)isExpoHostedUrlComponents:(NSURLComponents *)components;

/**
 *  Expects @"#ABCDEF"
 */
+ (nullable UIColor *)colorWithHexString:(nullable NSString *)hexString;

@end
