/**
 * Copyright (c) 2015-present, Horcrux.
 * All rights reserved.
 *
 * This source code is licensed under the MIT-style license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <React/UIView+React.h>
#import <CoreText/CoreText.h>
#import "RNSVGPercentageConverter.h"

@interface RNSVGGlyphContext : NSObject

- (instancetype)initWithDimensions:(CGFloat)width height:(CGFloat)height;
- (void)pushContext:(NSDictionary *)font deltaX:(NSArray<NSNumber *> *)deltaX deltaY:(NSArray<NSNumber *> *)deltaY positionX:(NSString *)positionX positionY:(NSString *)positionY;
- (void)popContext;
- (CTFontRef)getGlyphFont;
- (CGPoint)getNextGlyphPoint:(CGPoint)offset glyphWidth:(CGFloat)glyphWidth;

@end
