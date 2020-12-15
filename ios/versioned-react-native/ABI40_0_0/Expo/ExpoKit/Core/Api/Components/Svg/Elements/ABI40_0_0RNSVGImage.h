/**
 * Copyright (c) 2015-present, Horcrux.
 * All rights reserved.
 *
 * This source code is licensed under the MIT-style license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <Foundation/Foundation.h>

#import <ABI40_0_0React/ABI40_0_0RCTBridge.h>
#import "ABI40_0_0RNSVGRenderable.h"
#import "ABI40_0_0RNSVGVBMOS.h"
#import "ABI40_0_0RNSVGLength.h"

@interface ABI40_0_0RNSVGImage : ABI40_0_0RNSVGRenderable

@property (nonatomic, weak) ABI40_0_0RCTBridge *bridge;
@property (nonatomic, assign) id src;
@property (nonatomic, strong) ABI40_0_0RNSVGLength* x;
@property (nonatomic, strong) ABI40_0_0RNSVGLength* y;
@property (nonatomic, strong) ABI40_0_0RNSVGLength* imagewidth;
@property (nonatomic, strong) ABI40_0_0RNSVGLength* imageheight;
@property (nonatomic, strong) NSString *align;
@property (nonatomic, assign) ABI40_0_0RNSVGVBMOS meetOrSlice;

@end
