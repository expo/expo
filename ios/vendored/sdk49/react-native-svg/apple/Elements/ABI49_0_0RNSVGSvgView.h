/**
 * Copyright (c) 2015-present, Horcrux.
 * All rights reserved.
 *
 * This source code is licensed under the MIT-style license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "ABI49_0_0RNSVGUIKit.h"

#import "ABI49_0_0RNSVGContainer.h"
#import "ABI49_0_0RNSVGPainter.h"
#import "ABI49_0_0RNSVGVBMOS.h"

#ifdef ABI49_0_0RCT_NEW_ARCH_ENABLED
#import <ABI49_0_0React/ABI49_0_0RCTViewComponentView.h>
#endif // ABI49_0_0RCT_NEW_ARCH_ENABLED

@class ABI49_0_0RNSVGNode;

@interface ABI49_0_0RNSVGSvgView :
#ifdef ABI49_0_0RCT_NEW_ARCH_ENABLED
    ABI49_0_0RCTViewComponentView <ABI49_0_0RNSVGContainer>
#else
    ABI49_0_0RNSVGView <ABI49_0_0RNSVGContainer>
#endif // ABI49_0_0RCT_NEW_ARCH_ENABLED

@property (nonatomic, strong) ABI49_0_0RNSVGLength *bbWidth;
@property (nonatomic, strong) ABI49_0_0RNSVGLength *bbHeight;
@property (nonatomic, assign) CGFloat minX;
@property (nonatomic, assign) CGFloat minY;
@property (nonatomic, assign) CGFloat vbWidth;
@property (nonatomic, assign) CGFloat vbHeight;
@property (nonatomic, strong) NSString *align;
@property (nonatomic, assign) ABI49_0_0RNSVGVBMOS meetOrSlice;
@property (nonatomic, assign) BOOL responsible;
@property (nonatomic, assign) BOOL active;
@property (nonatomic, assign) CGRect boundingBox;
@property (nonatomic, assign) CGAffineTransform initialCTM;
@property (nonatomic, assign) CGAffineTransform invInitialCTM;
@property (nonatomic, assign) CGAffineTransform viewBoxTransform;

/**
 * define <ClipPath></ClipPath> content as clipPath template.
 */
- (void)defineClipPath:(__kindof ABI49_0_0RNSVGNode *)clipPath clipPathName:(NSString *)clipPathName;

- (ABI49_0_0RNSVGNode *)getDefinedClipPath:(NSString *)clipPathName;

- (void)defineTemplate:(__kindof ABI49_0_0RNSVGNode *)definedTemplate templateName:(NSString *)templateName;

- (ABI49_0_0RNSVGNode *)getDefinedTemplate:(NSString *)templateName;

- (void)definePainter:(ABI49_0_0RNSVGPainter *)painter painterName:(NSString *)painterName;

- (ABI49_0_0RNSVGPainter *)getDefinedPainter:(NSString *)painterName;

- (void)defineMarker:(ABI49_0_0RNSVGNode *)marker markerName:(NSString *)markerName;

- (ABI49_0_0RNSVGNode *)getDefinedMarker:(NSString *)markerName;

- (void)defineMask:(ABI49_0_0RNSVGNode *)mask maskName:(NSString *)maskName;

- (ABI49_0_0RNSVGNode *)getDefinedMask:(NSString *)maskName;

- (NSString *)getDataURL;

- (NSString *)getDataURLwithBounds:(CGRect)bounds;

- (CGRect)getContextBounds;

- (void)drawRect:(CGRect)rect;

- (void)drawToContext:(CGContextRef)context withRect:(CGRect)rect;

- (CGAffineTransform)getViewBoxTransform;

@end
