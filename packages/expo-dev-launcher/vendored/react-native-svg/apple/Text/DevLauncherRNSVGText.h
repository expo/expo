/**
 * Copyright (c) 2015-present, Horcrux.
 * All rights reserved.
 *
 * This source code is licensed under the MIT-style license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <Foundation/Foundation.h>
#import "DevLauncherRNSVGGroup.h"

@interface DevLauncherRNSVGText : DevLauncherRNSVGGroup

@property (nonatomic, strong) DevLauncherRNSVGLength *inlineSize;
@property (nonatomic, strong) DevLauncherRNSVGLength *textLength;
@property (nonatomic, strong) NSString *baselineShift;
@property (nonatomic, strong) NSString *lengthAdjust;
@property (nonatomic, strong) NSString *alignmentBaseline;
@property (nonatomic, strong) NSArray<DevLauncherRNSVGLength *> *deltaX;
@property (nonatomic, strong) NSArray<DevLauncherRNSVGLength *> *deltaY;
@property (nonatomic, strong) NSArray<DevLauncherRNSVGLength *> *positionX;
@property (nonatomic, strong) NSArray<DevLauncherRNSVGLength *> *positionY;
@property (nonatomic, strong) NSArray<DevLauncherRNSVGLength *> *rotate;

- (CGPathRef)getGroupPath:(CGContextRef)context;
- (CTFontRef)getFontFromContext;
- (CGFloat)getSubtreeTextChunksTotalAdvance;
- (DevLauncherRNSVGText*)getTextAnchorRoot;

@end
