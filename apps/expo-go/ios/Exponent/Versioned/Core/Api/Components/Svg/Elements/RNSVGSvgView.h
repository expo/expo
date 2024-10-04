/**
 * Copyright (c) 2015-present, Horcrux.
 * All rights reserved.
 *
 * This source code is licensed under the MIT-style license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "RNSVGUIKit.h"

#import "RNSVGPainter.h"
#import "RNSVGContainer.h"
#import "RNSVGVBMOS.h"

@class RNSVGNode;

@interface RNSVGSvgView : RNSVGView <RNSVGContainer>

@property (nonatomic, strong) RNSVGLength *bbWidth;
@property (nonatomic, strong) RNSVGLength *bbHeight;
@property (nonatomic, assign) CGFloat minX;
@property (nonatomic, assign) CGFloat minY;
@property (nonatomic, assign) CGFloat vbWidth;
@property (nonatomic, assign) CGFloat vbHeight;
@property (nonatomic, strong) NSString *align;
@property (nonatomic, assign) RNSVGVBMOS meetOrSlice;
@property (nonatomic, assign) BOOL responsible;
@property (nonatomic, assign) BOOL active;
@property (nonatomic, assign) CGRect boundingBox;
@property (nonatomic, assign) CGAffineTransform initialCTM;
@property (nonatomic, assign) CGAffineTransform invInitialCTM;
@property (nonatomic, assign) CGAffineTransform viewBoxTransform;

/**
 * define <ClipPath></ClipPath> content as clipPath template.
 */
- (void)defineClipPath:(__kindof RNSVGNode *)clipPath clipPathName:(NSString *)clipPathName;

- (RNSVGNode *)getDefinedClipPath:(NSString *)clipPathName;

- (void)defineTemplate:(__kindof RNSVGNode *)template templateName:(NSString *)templateName;

- (RNSVGNode *)getDefinedTemplate:(NSString *)templateName;

- (void)definePainter:(RNSVGPainter *)painter painterName:(NSString *)painterName;

- (RNSVGPainter *)getDefinedPainter:(NSString *)painterName;

- (void)defineMarker:(RNSVGNode *)marker markerName:(NSString *)markerName;

- (RNSVGNode *)getDefinedMarker:(NSString *)markerName;

- (void)defineMask:(RNSVGNode *)mask maskName:(NSString *)maskName;

- (RNSVGNode *)getDefinedMask:(NSString *)maskName;

- (NSString *)getDataURL;

- (NSString *)getDataURLwithBounds:(CGRect)bounds;

- (CGRect)getContextBounds;

- (void)drawRect:(CGRect)rect;

- (void)drawToContext:(CGContextRef)context withRect:(CGRect)rect;

- (CGAffineTransform)getViewBoxTransform;

@end
