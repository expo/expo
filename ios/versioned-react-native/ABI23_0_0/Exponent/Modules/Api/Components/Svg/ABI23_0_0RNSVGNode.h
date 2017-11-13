/**
 * Copyright (c) 2015-present, Horcrux.
 * All rights reserved.
 *
 * This source code is licensed under the MIT-style license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <ReactABI23_0_0/UIView+ReactABI23_0_0.h>
#import "ABI23_0_0RNSVGCGFCRule.h"
#import "ABI23_0_0RNSVGSvgView.h"

/**
 * ABI23_0_0RNSVG nodes are implemented as base UIViews. They should be implementation for all basic
 ＊interfaces for all non-defination nodes.
 */

@interface ABI23_0_0RNSVGNode : UIView

@property (nonatomic, strong) NSString *name;
@property (nonatomic, assign) CGFloat opacity;
@property (nonatomic, assign) ABI23_0_0RNSVGCGFCRule clipRule;
@property (nonatomic, strong) NSString *clipPath;
@property (nonatomic, assign) BOOL responsible;
@property (nonatomic, assign) CGAffineTransform matrix;
@property (nonatomic, assign) BOOL active;

- (void)invalidate;

- (void)renderTo:(CGContextRef)context;

/**
 * renderTo will take opacity into account and draw renderLayerTo off-screen if there is opacity
 * specified, then composite that onto the context. renderLayerTo always draws at opacity=1.
 * @abstract
 */
- (void)renderLayerTo:(CGContextRef)context;

/**
 * get clipPath from cache
 */
- (CGPathRef)getClipPath;

/**
 * get clipPath through context
 */
- (CGPathRef)getClipPath:(CGContextRef)context;

/**
 * clip node by clipPath
 */
- (void)clip:(CGContextRef)context;

/**
 * getPath will return the path inside node as a ClipPath.
 */
- (CGPathRef)getPath:(CGContextRef) context;

/**
 * run hitTest
 */
- (UIView *)hitTest:(CGPoint)point withEvent:(UIEvent *)event withTransform:(CGAffineTransform)transfrom;

/**
 * get ABI23_0_0RNSVGSvgView which ownes current ABI23_0_0RNSVGNode
 */
- (ABI23_0_0RNSVGSvgView *)getSvgView;

- (CGFloat)relativeOnWidth:(NSString *)length;

- (CGFloat)relativeOnHeight:(NSString *)length;

- (CGFloat)getContextWidth;

- (CGFloat)getContextHeight;

- (CGFloat)getContextLeft;

- (CGFloat)getContextTop;

/**
 * save element`s reference into svg element.
 */
- (void)parseReference;

- (void)beginTransparencyLayer:(CGContextRef)context;

- (void)endTransparencyLayer:(CGContextRef)context;

- (void)traverseSubviews:(BOOL (^)(__kindof ABI23_0_0RNSVGNode *node))block;

@end
