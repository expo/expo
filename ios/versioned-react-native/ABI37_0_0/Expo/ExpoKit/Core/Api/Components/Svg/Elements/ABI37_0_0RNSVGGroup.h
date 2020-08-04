/**
 * Copyright (c) 2015-present, Horcrux.
 * All rights reserved.
 *
 * This source code is licensed under the MIT-style license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <Foundation/Foundation.h>
#import <UIKit/UIKit.h>
#import "ABI37_0_0RNSVGContainer.h"
#import "ABI37_0_0RNSVGCGFCRule.h"
#import "ABI37_0_0RNSVGSvgView.h"
#import "ABI37_0_0RNSVGPath.h"
#import "ABI37_0_0RNSVGGlyphContext.h"

@interface ABI37_0_0RNSVGGroup : ABI37_0_0RNSVGPath <ABI37_0_0RNSVGContainer>

@property (nonatomic, strong) NSDictionary *font;

- (void)renderPathTo:(CGContextRef)context rect:(CGRect)rect;
- (void)renderGroupTo:(CGContextRef)context rect:(CGRect)rect;

- (ABI37_0_0RNSVGGlyphContext *)getGlyphContext;
- (void)pushGlyphContext;
- (void)popGlyphContext;
@end
