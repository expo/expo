/**
 * Copyright (c) 2015-present, Horcrux.
 * All rights reserved.
 *
 * This source code is licensed under the MIT-style license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "RNSVGCGFCRule.h"
#import "RNSVGSvgView.h"

#import <React/RCTPointerEvents.h>
#import <React/UIView+React.h>

#ifdef RCT_NEW_ARCH_ENABLED
#import <React/RCTViewComponentView.h>
#endif // RCT_NEW_ARCH_ENABLED

@class RNSVGGroup;

/**
 * RNSVG nodes are implemented as base NSViews/UIViews. They should be implementation for all basic
 ＊interfaces for all non-definition nodes.
 */

@interface RNSVGNode :
#ifdef RCT_NEW_ARCH_ENABLED
    RCTViewComponentView
#else
    RNSVGView
#endif // RCT_NEW_ARCH_ENABLED
/*
 N[1/Sqrt[2], 36]
 The inverse of the square root of 2.
 Provide enough digits for the 128-bit IEEE quad (36 significant digits).
 */
extern CGFloat const RNSVG_M_SQRT1_2l;
extern CGFloat const RNSVG_DEFAULT_FONT_SIZE;

@property (nonatomic, strong) NSString *name;
@property (nonatomic, strong) NSString *display;
@property (nonatomic, assign) CGFloat opacity;
@property (nonatomic, assign) RNSVGCGFCRule clipRule;
@property (nonatomic, strong) NSString *clipPath;
@property (nonatomic, strong) NSString *mask;
@property (nonatomic, strong) NSString *markerStart;
@property (nonatomic, strong) NSString *markerMid;
@property (nonatomic, strong) NSString *markerEnd;
@property (nonatomic, strong) RNSVGPlatformView *parentComponentView;

/**
 * Used to control how touch events are processed.
 */
@property (nonatomic, assign) RCTPointerEvents pointerEvents;
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
@property (nonatomic, copy) RCTDirectEventBlock onLayout;

/**
 * RNSVGSvgView which ownes current RNSVGNode
 */
@property (nonatomic, readonly, weak) RNSVGSvgView *svgView;
@property (nonatomic, readonly, weak) RNSVGGroup *textRoot;

- (void)invalidate;

- (RNSVGGroup *)getParentTextRoot;

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
- (CGPathRef)getPath:(CGContextRef)context;

- (CGFloat)relativeOnWidthString:(NSString *)length;

- (CGFloat)relativeOnHeightString:(NSString *)length;

- (CGFloat)relativeOnOtherString:(NSString *)length;

- (CGFloat)relativeOn:(RNSVGLength *)length relative:(CGFloat)relative;

- (CGFloat)relativeOnWidth:(RNSVGLength *)length;

- (CGFloat)relativeOnHeight:(RNSVGLength *)length;

- (CGFloat)relativeOnOther:(RNSVGLength *)length;

- (CGFloat)getFontSizeFromContext;

- (CGFloat)getContextWidth;

- (CGFloat)getContextHeight;

/**
 * save element`s reference into svg element.
 */
- (void)parseReference;

- (void)beginTransparencyLayer:(CGContextRef)context;

- (void)endTransparencyLayer:(CGContextRef)context;

- (void)traverseSubviews:(BOOL (^)(__kindof RNSVGView *node))block;

- (void)clearChildCache;

- (void)clearPath;

@end
