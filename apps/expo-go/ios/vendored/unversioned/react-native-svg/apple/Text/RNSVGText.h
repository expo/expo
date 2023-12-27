/**
 * Copyright (c) 2015-present, Horcrux.
 * All rights reserved.
 *
 * This source code is licensed under the MIT-style license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <Foundation/Foundation.h>
#import "RNSVGGroup.h"

@interface RNSVGText : RNSVGGroup

@property (nonatomic, strong) RNSVGLength *inlineSize;
@property (nonatomic, strong) RNSVGLength *textLength;
@property (nonatomic, strong) NSString *baselineShift;
@property (nonatomic, strong) NSString *lengthAdjust;
@property (nonatomic, strong) NSString *alignmentBaseline;
@property (nonatomic, strong) NSArray<RNSVGLength *> *deltaX;
@property (nonatomic, strong) NSArray<RNSVGLength *> *deltaY;
@property (nonatomic, strong) NSArray<RNSVGLength *> *positionX;
@property (nonatomic, strong) NSArray<RNSVGLength *> *positionY;
@property (nonatomic, strong) NSArray<RNSVGLength *> *rotate;

- (CGPathRef)getGroupPath:(CGContextRef)context;
- (CTFontRef)getFontFromContext;
- (CGFloat)getSubtreeTextChunksTotalAdvance;
- (RNSVGText *)getTextAnchorRoot;

@end
