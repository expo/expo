/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <Foundation/Foundation.h>

#import <ABI48_0_0React/ABI48_0_0RCTConvert.h>

typedef UIFont * (^ABI48_0_0RCTFontHandler)(CGFloat fontSize, NSString *fontWeightDescription);

/**
 * ABI48_0_0React Native will use the System font for rendering by default. If you want to
 * provide a different base font, use this override. The font weight supplied to your
 * handler will be one of "ultralight", "thin", "light", "regular", "medium",
 * "semibold", "extrabold", "bold", "heavy", or "black".
 */
ABI48_0_0RCT_EXTERN void ABI48_0_0RCTSetDefaultFontHandler(ABI48_0_0RCTFontHandler handler);
ABI48_0_0RCT_EXTERN BOOL ABI48_0_0RCTHasFontHandlerSet(void);

@interface ABI48_0_0RCTFont : NSObject

/**
 * Update a font with a given font-family, size, weight and style.
 * If parameters are not specified, they'll be kept as-is.
 * If font is nil, the default system font of size 14 will be used.
 */
+ (UIFont *)updateFont:(UIFont *)font
            withFamily:(NSString *)family
                  size:(NSNumber *)size
                weight:(NSString *)weight
                 style:(NSString *)style
               variant:(NSArray<NSString *> *)variant
       scaleMultiplier:(CGFloat)scaleMultiplier;

+ (UIFont *)updateFont:(UIFont *)font withFamily:(NSString *)family;
+ (UIFont *)updateFont:(UIFont *)font withSize:(NSNumber *)size;
+ (UIFont *)updateFont:(UIFont *)font withWeight:(NSString *)weight;
+ (UIFont *)updateFont:(UIFont *)font withStyle:(NSString *)style;

@end

@interface ABI48_0_0RCTConvert (ABI48_0_0RCTFont)

+ (UIFont *)UIFont:(id)json;

@end
