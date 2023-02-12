/**
 * Copyright (c) 2015-present, Horcrux.
 * All rights reserved.
 *
 * This source code is licensed under the MIT-style license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <Foundation/Foundation.h>

#import <React/RCTBridge.h>
#import "RNSVGLength.h"
#import "RNSVGRenderable.h"
#import "RNSVGVBMOS.h"

#import <React/RCTImageSource.h>

@interface RNSVGImage : RNSVGRenderable

@property (nonatomic, weak) RCTBridge *bridge;
@property (nonatomic, assign) RCTImageSource *src;
@property (nonatomic, strong) RNSVGLength *x;
@property (nonatomic, strong) RNSVGLength *y;
@property (nonatomic, strong) RNSVGLength *imagewidth;
@property (nonatomic, strong) RNSVGLength *imageheight;
@property (nonatomic, strong) NSString *align;
@property (nonatomic, assign) RNSVGVBMOS meetOrSlice;

- (void)setImageSrc:(RCTImageSource *)source request:(NSURLRequest *)request;

@end
