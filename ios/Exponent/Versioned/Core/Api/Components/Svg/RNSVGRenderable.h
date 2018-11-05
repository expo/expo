/**
 * Copyright (c) 2015-present, Horcrux.
 * All rights reserved.
 *
 * This source code is licensed under the MIT-style license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <Foundation/Foundation.h>

#import "RNSVGBrush.h"
#import "RNSVGCGFloatArray.h"
#import "RNSVGCGFCRule.h"
#import "RNSVGNode.h"
#import "RNSVGPercentageConverter.h"

@interface RNSVGRenderable : RNSVGNode

@property (nonatomic, strong) RNSVGBrush *fill;
@property (nonatomic, assign) CGFloat fillOpacity;
@property (nonatomic, assign) RNSVGCGFCRule fillRule;
@property (nonatomic, strong) RNSVGBrush *stroke;
@property (nonatomic, assign) CGFloat strokeOpacity;
@property (nonatomic, strong) NSString *strokeWidth;
@property (nonatomic, assign) CGLineCap strokeLinecap;
@property (nonatomic, assign) CGLineJoin strokeLinejoin;
@property (nonatomic, assign) CGFloat strokeMiterlimit;
@property (nonatomic, assign) RNSVGCGFloatArray strokeDasharrayData;
@property (nonatomic, strong) NSArray<NSString *> *strokeDasharray;
@property (nonatomic, assign) CGFloat strokeDashoffset;
@property (nonatomic, copy) NSArray<NSString *> *propList;

- (void)setHitArea:(CGPathRef)path;

- (NSArray<NSString *> *)getAttributeList;

- (void)mergeProperties:(__kindof RNSVGRenderable *)target;

- (void)resetProperties;

@end
