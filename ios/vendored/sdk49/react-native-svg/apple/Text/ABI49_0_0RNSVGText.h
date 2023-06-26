/**
 * Copyright (c) 2015-present, Horcrux.
 * All rights reserved.
 *
 * This source code is licensed under the MIT-style license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <Foundation/Foundation.h>
#import "ABI49_0_0RNSVGGroup.h"

@interface ABI49_0_0RNSVGText : ABI49_0_0RNSVGGroup

@property (nonatomic, strong) ABI49_0_0RNSVGLength *inlineSize;
@property (nonatomic, strong) ABI49_0_0RNSVGLength *textLength;
@property (nonatomic, strong) NSString *baselineShift;
@property (nonatomic, strong) NSString *lengthAdjust;
@property (nonatomic, strong) NSString *alignmentBaseline;
@property (nonatomic, strong) NSArray<ABI49_0_0RNSVGLength *> *deltaX;
@property (nonatomic, strong) NSArray<ABI49_0_0RNSVGLength *> *deltaY;
@property (nonatomic, strong) NSArray<ABI49_0_0RNSVGLength *> *positionX;
@property (nonatomic, strong) NSArray<ABI49_0_0RNSVGLength *> *positionY;
@property (nonatomic, strong) NSArray<ABI49_0_0RNSVGLength *> *rotate;

- (CGPathRef)getGroupPath:(CGContextRef)context;
- (CTFontRef)getFontFromContext;
- (CGFloat)getSubtreeTextChunksTotalAdvance;
- (ABI49_0_0RNSVGText *)getTextAnchorRoot;

@end
