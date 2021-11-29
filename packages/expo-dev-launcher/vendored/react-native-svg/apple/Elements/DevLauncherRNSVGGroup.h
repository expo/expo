/**
 * Copyright (c) 2015-present, Horcrux.
 * All rights reserved.
 *
 * This source code is licensed under the MIT-style license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <Foundation/Foundation.h>

#import "DevLauncherRNSVGUIKit.h"

#import "DevLauncherRNSVGContainer.h"
#import "DevLauncherRNSVGCGFCRule.h"
#import "DevLauncherRNSVGSvgView.h"
#import "DevLauncherRNSVGPath.h"
#import "DevLauncherRNSVGGlyphContext.h"

@interface DevLauncherRNSVGGroup : DevLauncherRNSVGPath <DevLauncherRNSVGContainer>

@property (nonatomic, strong) NSDictionary *font;

- (void)renderPathTo:(CGContextRef)context rect:(CGRect)rect;
- (void)renderGroupTo:(CGContextRef)context rect:(CGRect)rect;

- (DevLauncherRNSVGGlyphContext *)getGlyphContext;
- (void)pushGlyphContext;
- (void)popGlyphContext;
@end
