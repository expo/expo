/**
 * Copyright (c) 2015-present, Horcrux.
 * All rights reserved.
 *
 * This source code is licensed under the MIT-style license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "ABI42_0_0RNSVGUIKit.h"

#import "ABI42_0_0RNSVGPainter.h"
#import "ABI42_0_0RNSVGContainer.h"
#import "ABI42_0_0RNSVGVBMOS.h"

@class ABI42_0_0RNSVGNode;

@interface ABI42_0_0RNSVGSvgView : ABI42_0_0RNSVGView <ABI42_0_0RNSVGContainer>

@property (nonatomic, strong) ABI42_0_0RNSVGLength *bbWidth;
@property (nonatomic, strong) ABI42_0_0RNSVGLength *bbHeight;
@property (nonatomic, assign) CGFloat minX;
@property (nonatomic, assign) CGFloat minY;
@property (nonatomic, assign) CGFloat vbWidth;
@property (nonatomic, assign) CGFloat vbHeight;
@property (nonatomic, strong) NSString *align;
@property (nonatomic, assign) ABI42_0_0RNSVGVBMOS meetOrSlice;
@property (nonatomic, assign) BOOL responsible;
@property (nonatomic, assign) BOOL active;
@property (nonatomic, assign) CGRect boundingBox;
@property (nonatomic, assign) CGAffineTransform initialCTM;
@property (nonatomic, assign) CGAffineTransform invInitialCTM;
@property (nonatomic, assign) CGAffineTransform viewBoxTransform;

/**
 * define <ClipPath></ClipPath> content as clipPath template.
 */
- (void)defineClipPath:(__kindof ABI42_0_0RNSVGNode *)clipPath clipPathName:(NSString *)clipPathName;

- (ABI42_0_0RNSVGNode *)getDefinedClipPath:(NSString *)clipPathName;

- (void)defineTemplate:(__kindof ABI42_0_0RNSVGNode *)template templateName:(NSString *)templateName;

- (ABI42_0_0RNSVGNode *)getDefinedTemplate:(NSString *)templateName;

- (void)definePainter:(ABI42_0_0RNSVGPainter *)painter painterName:(NSString *)painterName;

- (ABI42_0_0RNSVGPainter *)getDefinedPainter:(NSString *)painterName;

- (void)defineMarker:(ABI42_0_0RNSVGNode *)marker markerName:(NSString *)markerName;

- (ABI42_0_0RNSVGNode *)getDefinedMarker:(NSString *)markerName;

- (void)defineMask:(ABI42_0_0RNSVGNode *)mask maskName:(NSString *)maskName;

- (ABI42_0_0RNSVGNode *)getDefinedMask:(NSString *)maskName;

- (NSString *)getDataURL;

- (NSString *)getDataURLwithBounds:(CGRect)bounds;

- (CGRect)getContextBounds;

- (void)drawRect:(CGRect)rect;

- (void)drawToContext:(CGContextRef)context withRect:(CGRect)rect;

- (CGAffineTransform)getViewBoxTransform;

@end
