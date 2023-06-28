/**
 * Copyright (c) 2015-present, Horcrux.
 * All rights reserved.
 *
 * This source code is licensed under the MIT-style license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <Foundation/Foundation.h>

#import <ABI49_0_0React/ABI49_0_0RCTBridge.h>
#import "ABI49_0_0RNSVGLength.h"
#import "ABI49_0_0RNSVGRenderable.h"
#import "ABI49_0_0RNSVGVBMOS.h"

#import <ABI49_0_0React/ABI49_0_0RCTImageSource.h>

#ifdef ABI49_0_0RCT_NEW_ARCH_ENABLED
#import <ABI49_0_0React/ABI49_0_0RCTImageResponseDelegate.h>
#endif

@interface ABI49_0_0RNSVGImage : ABI49_0_0RNSVGRenderable
#ifdef ABI49_0_0RCT_NEW_ARCH_ENABLED
                        <ABI49_0_0RCTImageResponseDelegate>
#endif

@property (nonatomic, weak) ABI49_0_0RCTBridge *bridge;
@property (nonatomic, assign) ABI49_0_0RCTImageSource *src;
@property (nonatomic, strong) ABI49_0_0RNSVGLength *x;
@property (nonatomic, strong) ABI49_0_0RNSVGLength *y;
@property (nonatomic, strong) ABI49_0_0RNSVGLength *imagewidth;
@property (nonatomic, strong) ABI49_0_0RNSVGLength *imageheight;
@property (nonatomic, strong) NSString *align;
@property (nonatomic, assign) ABI49_0_0RNSVGVBMOS meetOrSlice;

@end
