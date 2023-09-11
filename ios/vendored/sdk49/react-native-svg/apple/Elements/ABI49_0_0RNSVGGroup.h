/**
 * Copyright (c) 2015-present, Horcrux.
 * All rights reserved.
 *
 * This source code is licensed under the MIT-style license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <Foundation/Foundation.h>

#import "ABI49_0_0RNSVGUIKit.h"

#import "ABI49_0_0RNSVGCGFCRule.h"
#import "ABI49_0_0RNSVGContainer.h"
#import "ABI49_0_0RNSVGGlyphContext.h"
#import "ABI49_0_0RNSVGPath.h"
#import "ABI49_0_0RNSVGSvgView.h"

@interface ABI49_0_0RNSVGGroup : ABI49_0_0RNSVGPath <ABI49_0_0RNSVGContainer>

@property (nonatomic, strong) NSDictionary *font;

- (void)renderPathTo:(CGContextRef)context rect:(CGRect)rect;
- (void)renderGroupTo:(CGContextRef)context rect:(CGRect)rect;

- (ABI49_0_0RNSVGGlyphContext *)getGlyphContext;
- (void)pushGlyphContext;
- (void)popGlyphContext;
@end
