//
//  UIColor.h
//  Lottie
//
//  Created by Oleksii Pavlovskyi on 2/2/17.
//  Copyright © 2017 Airbnb. All rights reserved.
//

#include <TargetConditionals.h>

#if !TARGET_OS_IPHONE && !TARGET_OS_SIMULATOR
#import <Foundation/Foundation.h>
#import <CoreGraphics/CoreGraphics.h>

@interface UIColor : NSObject <NSCopying>

+ (UIColor *)colorWithWhite:(CGFloat)white alpha:(CGFloat)alpha;
+ (UIColor *)colorWithHue:(CGFloat)hue saturation:(CGFloat)saturation brightness:(CGFloat)brightness alpha:(CGFloat)alpha;
+ (UIColor *)colorWithRed:(CGFloat)red green:(CGFloat)green blue:(CGFloat)blue alpha:(CGFloat)alpha;
+ (UIColor *)colorWithCGColor:(CGColorRef)cgColor;

+ (UIColor *)blackColor;     
+ (UIColor *)darkGrayColor;  
+ (UIColor *)lightGrayColor; 
+ (UIColor *)whiteColor;     
+ (UIColor *)grayColor;      
+ (UIColor *)redColor;       
+ (UIColor *)greenColor;     
+ (UIColor *)blueColor;      
+ (UIColor *)cyanColor;      
+ (UIColor *)yellowColor;    
+ (UIColor *)magentaColor;   
+ (UIColor *)orangeColor;    
+ (UIColor *)purpleColor;    
+ (UIColor *)brownColor;     
+ (UIColor *)clearColor;

- (UIColor *)colorWithAlphaComponent:(CGFloat)alpha;

@property (nonatomic, readonly) CGColorRef CGColor;

@end

#endif
