/**
 * Copyright (c) 2015-present, Horcrux.
 * All rights reserved.
 *
 * This source code is licensed under the MIT-style license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <Foundation/Foundation.h>

#import "DevLauncherRNSVGUIKit.h"

#import "DevLauncherRNSVGBrush.h"
#import "DevLauncherRNSVGCGFCRule.h"
#import "DevLauncherRNSVGNode.h"
#import "DevLauncherRNSVGLength.h"
#import "DevLauncherRNSVGVectorEffect.h"

@interface DevLauncherRNSVGRenderable : DevLauncherRNSVGNode

@property (class) DevLauncherRNSVGRenderable *contextElement;
@property (nonatomic, strong) DevLauncherRNSVGBrush *fill;
@property (nonatomic, assign) CGFloat fillOpacity;
@property (nonatomic, assign) DevLauncherRNSVGCGFCRule fillRule;
@property (nonatomic, strong) DevLauncherRNSVGBrush *stroke;
@property (nonatomic, assign) CGFloat strokeOpacity;
@property (nonatomic, strong) DevLauncherRNSVGLength *strokeWidth;
@property (nonatomic, assign) CGLineCap strokeLinecap;
@property (nonatomic, assign) CGLineJoin strokeLinejoin;
@property (nonatomic, assign) CGFloat strokeMiterlimit;
@property (nonatomic, strong) NSArray<DevLauncherRNSVGLength *> *strokeDasharray;
@property (nonatomic, assign) CGFloat strokeDashoffset;
@property (nonatomic, assign) DevLauncherRNSVGVectorEffect vectorEffect;
@property (nonatomic, copy) NSArray<NSString *> *propList;
@property (nonatomic, assign) CGPathRef hitArea;

- (void)setHitArea:(CGPathRef)path;

- (NSArray<NSString *> *)getAttributeList;

- (void)mergeProperties:(__kindof DevLauncherRNSVGRenderable *)target;

- (void)resetProperties;

@end
