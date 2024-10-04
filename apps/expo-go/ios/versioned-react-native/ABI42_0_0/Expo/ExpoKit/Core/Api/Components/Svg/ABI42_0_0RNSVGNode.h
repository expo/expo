/**
 * Copyright (c) 2015-present, Horcrux.
 * All rights reserved.
 *
 * This source code is licensed under the MIT-style license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <ABI42_0_0React/ABI42_0_0UIView+React.h>
#import <ABI42_0_0React/ABI42_0_0RCTPointerEvents.h>
#import "ABI42_0_0RNSVGCGFCRule.h"
#import "ABI42_0_0RNSVGSvgView.h"
@class ABI42_0_0RNSVGGroup;

/**
 * ABI42_0_0RNSVG nodes are implemented as base NSViews/UIViews. They should be implementation for all basic
 ＊interfaces for all non-definition nodes.
 */

@interface ABI42_0_0RNSVGNode : ABI42_0_0RNSVGView

/*
 N[1/Sqrt[2], 36]
 The inverse of the square root of 2.
 Provide enough digits for the 128-bit IEEE quad (36 significant digits).
 */
extern CGFloat const ABI42_0_0RNSVG_M_SQRT1_2l;
extern CGFloat const ABI42_0_0RNSVG_DEFAULT_FONT_SIZE;

@property (nonatomic, strong) NSString *name;
@property (nonatomic, strong) NSString *display;
@property (nonatomic, assign) CGFloat opacity;
@property (nonatomic, assign) ABI42_0_0RNSVGCGFCRule clipRule;
@property (nonatomic, strong) NSString *clipPath;
@property (nonatomic, strong) NSString *mask;
@property (nonatomic, strong) NSString *markerStart;
@property (nonatomic, strong) NSString *markerMid;
@property (nonatomic, strong) NSString *markerEnd;

/**
 * Used to control how touch events are processed.
 */
@property (nonatomic, assign) ABI42_0_0RCTPointerEvents pointerEvents;
@property (nonatomic, assign) BOOL responsible;

@property (nonatomic, assign) CGAffineTransform ctm;
@property (nonatomic, assign) CGAffineTransform screenCTM;
@property (nonatomic, assign) CGAffineTransform matrix;
@property (nonatomic, assign) CGAffineTransform transforms;
@property (nonatomic, assign) CGAffineTransform invmatrix;
@property (nonatomic, assign) CGAffineTransform invTransform;
@property (nonatomic, assign) BOOL active;
@property (nonatomic, assign) BOOL dirty;
@property (nonatomic, assign) BOOL merging;
@property (nonatomic, assign) BOOL skip;
@property (nonatomic, assign) CGPathRef path;
@property (nonatomic, assign) CGPathRef strokePath;
@property (nonatomic, assign) CGPathRef markerPath;
@property (nonatomic, assign) CGRect clientRect;
@property (nonatomic, assign) CGRect pathBounds;
@property (nonatomic, assign) CGRect fillBounds;
@property (nonatomic, assign) CGRect strokeBounds;
@property (nonatomic, assign) CGRect markerBounds;
@property (nonatomic, copy) ABI42_0_0RCTDirectEventBlock onLayout;


/**
 * ABI42_0_0RNSVGSvgView which ownes current ABI42_0_0RNSVGNode
 */
@property (nonatomic, readonly, weak) ABI42_0_0RNSVGSvgView *svgView;
@property (nonatomic, readonly, weak) ABI42_0_0RNSVGGroup *textRoot;

- (void)invalidate;

- (ABI42_0_0RNSVGGroup *)getParentTextRoot;

- (void)renderTo:(CGContextRef)context rect:(CGRect)rect;

/**
 * @abstract
 * renderTo will take opacity into account and draw renderLayerTo off-screen if there is opacity
 * specified, then composite that onto the context. renderLayerTo always draws at opacity=1.
 */
- (void)renderLayerTo:(CGContextRef)context rect:(CGRect)rect;

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

- (CGFloat)relativeOnWidthString:(NSString *)length;

- (CGFloat)relativeOnHeightString:(NSString *)length;

- (CGFloat)relativeOnOtherString:(NSString *)length;

- (CGFloat)relativeOn:(ABI42_0_0RNSVGLength *)length relative:(CGFloat)relative;

- (CGFloat)relativeOnWidth:(ABI42_0_0RNSVGLength *)length;

- (CGFloat)relativeOnHeight:(ABI42_0_0RNSVGLength *)length;

- (CGFloat)relativeOnOther:(ABI42_0_0RNSVGLength *)length;

- (CGFloat)getFontSizeFromContext;

- (CGFloat)getContextWidth;

- (CGFloat)getContextHeight;

/**
 * save element`s reference into svg element.
 */
- (void)parseReference;

- (void)beginTransparencyLayer:(CGContextRef)context;

- (void)endTransparencyLayer:(CGContextRef)context;

- (void)traverseSubviews:(BOOL (^)(__kindof ABI42_0_0RNSVGView *node))block;

- (void)clearChildCache;

- (void)clearPath;

@end
