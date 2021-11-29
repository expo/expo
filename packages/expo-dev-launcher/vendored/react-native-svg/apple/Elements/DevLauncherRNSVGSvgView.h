/**
 * Copyright (c) 2015-present, Horcrux.
 * All rights reserved.
 *
 * This source code is licensed under the MIT-style license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "DevLauncherRNSVGUIKit.h"

#import "DevLauncherRNSVGPainter.h"
#import "DevLauncherRNSVGContainer.h"
#import "DevLauncherRNSVGVBMOS.h"

@class DevLauncherRNSVGNode;

@interface DevLauncherRNSVGSvgView : DevLauncherRNSVGView <DevLauncherRNSVGContainer>

@property (nonatomic, strong) DevLauncherRNSVGLength *bbWidth;
@property (nonatomic, strong) DevLauncherRNSVGLength *bbHeight;
@property (nonatomic, assign) CGFloat minX;
@property (nonatomic, assign) CGFloat minY;
@property (nonatomic, assign) CGFloat vbWidth;
@property (nonatomic, assign) CGFloat vbHeight;
@property (nonatomic, strong) NSString *align;
@property (nonatomic, assign) DevLauncherRNSVGVBMOS meetOrSlice;
@property (nonatomic, assign) BOOL responsible;
@property (nonatomic, assign) BOOL active;
@property (nonatomic, assign) CGRect boundingBox;
@property (nonatomic, assign) CGAffineTransform initialCTM;
@property (nonatomic, assign) CGAffineTransform invInitialCTM;
@property (nonatomic, assign) CGAffineTransform viewBoxTransform;

/**
 * define <ClipPath></ClipPath> content as clipPath template.
 */
- (void)defineClipPath:(__kindof DevLauncherRNSVGNode *)clipPath clipPathName:(NSString *)clipPathName;

- (DevLauncherRNSVGNode *)getDefinedClipPath:(NSString *)clipPathName;

- (void)defineTemplate:(__kindof DevLauncherRNSVGNode *)template templateName:(NSString *)templateName;

- (DevLauncherRNSVGNode *)getDefinedTemplate:(NSString *)templateName;

- (void)definePainter:(DevLauncherRNSVGPainter *)painter painterName:(NSString *)painterName;

- (DevLauncherRNSVGPainter *)getDefinedPainter:(NSString *)painterName;

- (void)defineMarker:(DevLauncherRNSVGNode *)marker markerName:(NSString *)markerName;

- (DevLauncherRNSVGNode *)getDefinedMarker:(NSString *)markerName;

- (void)defineMask:(DevLauncherRNSVGNode *)mask maskName:(NSString *)maskName;

- (DevLauncherRNSVGNode *)getDefinedMask:(NSString *)maskName;

- (NSString *)getDataURL;

- (NSString *)getDataURLwithBounds:(CGRect)bounds;

- (CGRect)getContextBounds;

- (void)drawRect:(CGRect)rect;

- (void)drawToContext:(CGContextRef)context withRect:(CGRect)rect;

- (CGAffineTransform)getViewBoxTransform;

@end
