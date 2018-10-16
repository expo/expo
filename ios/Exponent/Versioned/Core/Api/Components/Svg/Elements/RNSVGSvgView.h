/**
 * Copyright (c) 2015-present, Horcrux.
 * All rights reserved.
 *
 * This source code is licensed under the MIT-style license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <UIKit/UIKit.h>
#import "RNSVGPainter.h"
#import "RNSVGContainer.h"
#import "RNSVGVBMOS.h"

@class RNSVGNode;

@interface RNSVGSvgView : UIView <RNSVGContainer>

@property (nonatomic, strong) NSString *bbWidth;
@property (nonatomic, strong) NSString *bbHeight;
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



/**
 * define <ClipPath></ClipPath> content as clipPath template.
 */
- (void)defineClipPath:(__kindof RNSVGNode *)clipPath clipPathName:(NSString *)clipPathName;

- (RNSVGNode *)getDefinedClipPath:(NSString *)clipPathName;

- (void)defineTemplate:(__kindof RNSVGNode *)template templateName:(NSString *)templateName;

- (RNSVGNode *)getDefinedTemplate:(NSString *)templateName;

- (void)definePainter:(RNSVGPainter *)painter painterName:(NSString *)painterName;

- (RNSVGPainter *)getDefinedPainter:(NSString *)painterName;

- (NSString *)getDataURL;

- (CGRect)getContextBounds;

- (void)drawRect:(CGRect)rect;

- (void)drawToContext:(CGContextRef)context withRect:(CGRect)rect;

@end
