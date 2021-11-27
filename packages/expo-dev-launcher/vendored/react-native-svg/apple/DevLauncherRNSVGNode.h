/**
 * Copyright (c) 2015-present, Horcrux.
 * All rights reserved.
 *
 * This source code is licensed under the MIT-style license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <React/UIView+React.h>
#import <React/RCTPointerEvents.h>
#import "DevLauncherRNSVGCGFCRule.h"
#import "DevLauncherRNSVGSvgView.h"
@class DevLauncherRNSVGGroup;

/**
 * DevLauncherRNSVG nodes are implemented as base NSViews/UIViews. They should be implementation for all basic
 ＊interfaces for all non-definition nodes.
 */

@interface DevLauncherRNSVGNode : DevLauncherRNSVGView

/*
 N[1/Sqrt[2], 36]
 The inverse of the square root of 2.
 Provide enough digits for the 128-bit IEEE quad (36 significant digits).
 */
extern CGFloat const DevLauncherRNSVG_M_SQRT1_2l;
extern CGFloat const DevLauncherRNSVG_DEFAULT_FONT_SIZE;

@property (nonatomic, strong) NSString *name;
@property (nonatomic, strong) NSString *display;
@property (nonatomic, assign) CGFloat opacity;
@property (nonatomic, assign) DevLauncherRNSVGCGFCRule clipRule;
@property (nonatomic, strong) NSString *clipPath;
@property (nonatomic, strong) NSString *mask;
@property (nonatomic, strong) NSString *markerStart;
@property (nonatomic, strong) NSString *markerMid;
@property (nonatomic, strong) NSString *markerEnd;

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
 * DevLauncherRNSVGSvgView which ownes current DevLauncherRNSVGNode
 */
@property (nonatomic, readonly, weak) DevLauncherRNSVGSvgView *svgView;
@property (nonatomic, readonly, weak) DevLauncherRNSVGGroup *textRoot;

- (void)invalidate;

- (DevLauncherRNSVGGroup *)getParentTextRoot;

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

- (CGFloat)relativeOn:(DevLauncherRNSVGLength *)length relative:(CGFloat)relative;

- (CGFloat)relativeOnWidth:(DevLauncherRNSVGLength *)length;

- (CGFloat)relativeOnHeight:(DevLauncherRNSVGLength *)length;

- (CGFloat)relativeOnOther:(DevLauncherRNSVGLength *)length;

- (CGFloat)getFontSizeFromContext;

- (CGFloat)getContextWidth;

- (CGFloat)getContextHeight;

/**
 * save element`s reference into svg element.
 */
- (void)parseReference;

- (void)beginTransparencyLayer:(CGContextRef)context;

- (void)endTransparencyLayer:(CGContextRef)context;

- (void)traverseSubviews:(BOOL (^)(__kindof DevLauncherRNSVGView *node))block;

- (void)clearChildCache;

- (void)clearPath;

@end
