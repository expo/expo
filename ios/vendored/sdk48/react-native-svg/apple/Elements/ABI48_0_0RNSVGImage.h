/**
 * Copyright (c) 2015-present, Horcrux.
 * All rights reserved.
 *
 * This source code is licensed under the MIT-style license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <Foundation/Foundation.h>

#import <ABI48_0_0React/ABI48_0_0RCTBridge.h>
#import "ABI48_0_0RNSVGLength.h"
#import "ABI48_0_0RNSVGRenderable.h"
#import "ABI48_0_0RNSVGVBMOS.h"

#import <ABI48_0_0React/ABI48_0_0RCTImageSource.h>

@interface ABI48_0_0RNSVGImage : ABI48_0_0RNSVGRenderable

@property (nonatomic, weak) ABI48_0_0RCTBridge *bridge;
@property (nonatomic, assign) ABI48_0_0RCTImageSource *src;
@property (nonatomic, strong) ABI48_0_0RNSVGLength *x;
@property (nonatomic, strong) ABI48_0_0RNSVGLength *y;
@property (nonatomic, strong) ABI48_0_0RNSVGLength *imagewidth;
@property (nonatomic, strong) ABI48_0_0RNSVGLength *imageheight;
@property (nonatomic, strong) NSString *align;
@property (nonatomic, assign) ABI48_0_0RNSVGVBMOS meetOrSlice;

- (void)setImageSrc:(ABI48_0_0RCTImageSource *)source request:(NSURLRequest *)request;

@end
