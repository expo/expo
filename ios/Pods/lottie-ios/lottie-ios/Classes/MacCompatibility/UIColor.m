//
//  UIColor.m
//  Lottie
//
//  Created by Oleksii Pavlovskyi on 2/2/17.
//  Copyright © 2017 Airbnb. All rights reserved.
//

#include <TargetConditionals.h>

#if !TARGET_OS_IPHONE && !TARGET_OS_SIMULATOR
#import "UIColor.h"
#import <AppKit/AppKit.h>

#define StaticColor(staticColor) \
static UIColor *color = nil; \
static dispatch_once_t onceToken; \
dispatch_once(&onceToken, ^{ \
    color = NSColor.staticColor.UIColor; \
}); \
return color; \

@interface UIColor ()

@property (nonatomic, strong) NSColor *color;

- (instancetype)initWithNSColor:(NSColor *)color;

@end

@interface NSColor (UIColor)

@property (nonatomic, readonly) UIColor *UIColor;

@end

@implementation UIColor

- (instancetype)initWithNSColor:(NSColor *)color {
    self = [super init];
    if (self) {
        self.color = color;
    }
    return self;
}

+ (UIColor *)colorWithNSColor:(NSColor *)color {
    return [[self alloc] initWithNSColor:color];
}

+ (UIColor *)colorWithWhite:(CGFloat)white alpha:(CGFloat)alpha {
    return [[NSColor colorWithWhite:white alpha:alpha] UIColor];
}

+ (UIColor *)colorWithHue:(CGFloat)hue
               saturation:(CGFloat)saturation
               brightness:(CGFloat)brightness
                    alpha:(CGFloat)alpha {
    return [[NSColor colorWithHue:hue
                       saturation:saturation
                       brightness:brightness
                            alpha:alpha] UIColor];
}

+ (UIColor *)colorWithRed:(CGFloat)red green:(CGFloat)green blue:(CGFloat)blue alpha:(CGFloat)alpha {
    return [[NSColor colorWithRed:red
                            green:green
                             blue:blue
                            alpha:alpha] UIColor];
}

+ (UIColor *)colorWithCGColor:(CGColorRef)cgColor {
    return [[NSColor colorWithCGColor:cgColor] UIColor];
}

+ (UIColor *)blackColor {
    StaticColor(blackColor)
}

+ (UIColor *)darkGrayColor {
    StaticColor(darkGrayColor)
}

+ (UIColor *)lightGrayColor {
    StaticColor(lightGrayColor)
}

+ (UIColor *)whiteColor {
    StaticColor(whiteColor)
}

+ (UIColor *)grayColor {
    StaticColor(grayColor)
}

+ (UIColor *)redColor {
    StaticColor(redColor)
}

+ (UIColor *)greenColor {
    StaticColor(greenColor)
}

+ (UIColor *)blueColor {
    StaticColor(blueColor)
}

+ (UIColor *)cyanColor {
    StaticColor(cyanColor)
}

+ (UIColor *)yellowColor {
    StaticColor(yellowColor)
}

+ (UIColor *)magentaColor {
    StaticColor(magentaColor)
}

+ (UIColor *)orangeColor {
    StaticColor(orangeColor)
}

+ (UIColor *)purpleColor {
    StaticColor(purpleColor)
}

+ (UIColor *)brownColor {
    StaticColor(brownColor)
}

+ (UIColor *)clearColor {
    StaticColor(clearColor)
}

- (CGColorRef)CGColor {
    return self.color.CGColor;
}

- (UIColor *)colorWithAlphaComponent:(CGFloat)alpha {
    return [self.color colorWithAlphaComponent:alpha].UIColor;
}

- (id)copyWithZone:(NSZone *)zone {
    return [[self.color copyWithZone:zone] UIColor];
}

@end

@implementation NSColor (UIColor)

- (UIColor *)UIColor {
    return [UIColor colorWithNSColor:self];
}

@end

#endif
