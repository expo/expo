/**
 * Copyright (c) 2015-present, Horcrux.
 * All rights reserved.
 *
 * This source code is licensed under the MIT-style license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <UIKit/UIKit.h>
#import "ABI30_0_0RNSVGPainter.h"
#import "ABI30_0_0RNSVGContainer.h"
#import "ABI30_0_0RNSVGVBMOS.h"

@class ABI30_0_0RNSVGNode;

@interface ABI30_0_0RNSVGSvgView : UIView <ABI30_0_0RNSVGContainer>

@property (nonatomic, assign) CGFloat minX;
@property (nonatomic, assign) CGFloat minY;
@property (nonatomic, assign) CGFloat vbWidth;
@property (nonatomic, assign) CGFloat vbHeight;
@property (nonatomic, strong) NSString *align;
@property (nonatomic, assign) ABI30_0_0RNSVGVBMOS meetOrSlice;
@property (nonatomic, assign) BOOL responsible;

/**
 * define <ClipPath></ClipPath> content as clipPath template.
 */
- (void)defineClipPath:(__kindof ABI30_0_0RNSVGNode *)clipPath clipPathName:(NSString *)clipPathName;

- (ABI30_0_0RNSVGNode *)getDefinedClipPath:(NSString *)clipPathName;

- (void)defineTemplate:(__kindof ABI30_0_0RNSVGNode *)template templateName:(NSString *)templateName;

- (ABI30_0_0RNSVGNode *)getDefinedTemplate:(NSString *)templateName;

- (void)definePainter:(ABI30_0_0RNSVGPainter *)painter painterName:(NSString *)painterName;

- (ABI30_0_0RNSVGPainter *)getDefinedPainter:(NSString *)painterName;

- (NSString *)getDataURL;

- (CGRect)getContextBounds;

@end
