/**
 * Copyright (c) 2015-present, Horcrux.
 * All rights reserved.
 *
 * This source code is licensed under the MIT-style license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "ABI10_0_0RNSVGGroup.h"
#import "ABI10_0_0RNSVGVBMOS.h"

@interface ABI10_0_0RNSVGViewBox : ABI10_0_0RNSVGGroup

@property (nonatomic, strong) NSString *minX;
@property (nonatomic, strong) NSString *minY;
@property (nonatomic, strong) NSString *vbWidth;
@property (nonatomic, strong) NSString *vbHeight;
@property (nonatomic, strong) NSString *align;
@property (nonatomic, assign) ABI10_0_0RNSVGVBMOS meetOrSlice;
@property (nonatomic, strong) NSString *width;
@property (nonatomic, strong) NSString *height;

- (CGAffineTransform)getTransform;

@end
