/**
 * Copyright (c) 2015-present, Horcrux.
 * All rights reserved.
 *
 * This source code is licensed under the MIT-style license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <Foundation/Foundation.h>

#import "ABI34_0_0RNSVGBrush.h"
#import "ABI34_0_0RNSVGCGFCRule.h"
#import "ABI34_0_0RNSVGNode.h"
#import "ABI34_0_0RNSVGLength.h"
#import "ABI34_0_0RNSVGVectorEffect.h"
#import "ABI34_0_0RNSVGPercentageConverter.h"

@interface ABI34_0_0RNSVGRenderable : ABI34_0_0RNSVGNode

@property (nonatomic, strong) ABI34_0_0RNSVGBrush *fill;
@property (nonatomic, assign) CGFloat fillOpacity;
@property (nonatomic, assign) ABI34_0_0RNSVGCGFCRule fillRule;
@property (nonatomic, strong) ABI34_0_0RNSVGBrush *stroke;
@property (nonatomic, assign) CGFloat strokeOpacity;
@property (nonatomic, strong) ABI34_0_0RNSVGLength *strokeWidth;
@property (nonatomic, assign) CGLineCap strokeLinecap;
@property (nonatomic, assign) CGLineJoin strokeLinejoin;
@property (nonatomic, assign) CGFloat strokeMiterlimit;
@property (nonatomic, strong) NSArray<ABI34_0_0RNSVGLength *> *strokeDasharray;
@property (nonatomic, assign) CGFloat strokeDashoffset;
@property (nonatomic, assign) ABI34_0_0RNSVGVectorEffect vectorEffect;
@property (nonatomic, copy) NSArray<NSString *> *propList;

- (void)setHitArea:(CGPathRef)path;

- (NSArray<NSString *> *)getAttributeList;

- (void)mergeProperties:(__kindof ABI34_0_0RNSVGRenderable *)target;

- (void)resetProperties;

@end
