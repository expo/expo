/**
 * Copyright (c) 2015-present, Horcrux.
 * All rights reserved.
 *
 * This source code is licensed under the MIT-style license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <Foundation/Foundation.h>
#import "ABI17_0_0RNSVGGroup.h"
#import "ABI17_0_0RNSVGTextAnchor.h"
#import "ABI17_0_0RNSVGGlyphContext.h"

@interface ABI17_0_0RNSVGText : ABI17_0_0RNSVGGroup

@property (nonatomic, assign) ABI17_0_0RNSVGTextAnchor textAnchor;
@property (nonatomic, strong) NSArray<NSNumber *> *deltaX;
@property (nonatomic, strong) NSArray<NSNumber *> *deltaY;
@property (nonatomic, strong) NSString *positionX;
@property (nonatomic, strong) NSString *positionY;
@property (nonatomic, strong) NSDictionary *font;

- (ABI17_0_0RNSVGText *)getTextRoot;
- (void)releaseCachedPath;
- (CGPathRef)getGroupPath:(CGContextRef)context;

- (ABI17_0_0RNSVGGlyphContext *)getGlyphContext;
- (void)pushGlyphContext;
- (void)popGlyphContext;
- (CTFontRef)getFontFromContext;
- (CGPoint)getGlyphPointFromContext:(CGPoint)offset glyphWidth:(CGFloat)glyphWidth;

@end
