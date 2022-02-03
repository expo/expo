/**
 * Copyright (c) 2015-present, Horcrux.
 * All rights reserved.
 *
 * This source code is licensed under the MIT-style license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <Foundation/Foundation.h>

#import "RNSVGUIKit.h"

#import "RNSVGContainer.h"
#import "RNSVGCGFCRule.h"
#import "RNSVGSvgView.h"
#import "RNSVGPath.h"
#import "RNSVGGlyphContext.h"

@interface RNSVGGroup : RNSVGPath <RNSVGContainer>

@property (nonatomic, strong) NSDictionary *font;

- (void)renderPathTo:(CGContextRef)context rect:(CGRect)rect;
- (void)renderGroupTo:(CGContextRef)context rect:(CGRect)rect;

- (RNSVGGlyphContext *)getGlyphContext;
- (void)pushGlyphContext;
- (void)popGlyphContext;
@end
