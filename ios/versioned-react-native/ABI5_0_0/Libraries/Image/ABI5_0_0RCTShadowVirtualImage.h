/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#import "ABI5_0_0RCTShadowView.h"
#import "ABI5_0_0RCTImageComponent.h"
#import "ABI5_0_0RCTImageSource.h"
#import "ABI5_0_0RCTResizeMode.h"

@class ABI5_0_0RCTBridge;

/**
 * Shadow image component, used for embedding images in non-view contexts such
 * as text. This is NOT used for ordinary <Image> views.
 */
@interface ABI5_0_0RCTShadowVirtualImage : ABI5_0_0RCTShadowView <ABI5_0_0RCTImageComponent>

- (instancetype)initWithBridge:(ABI5_0_0RCTBridge *)bridge;

@property (nonatomic, strong) ABI5_0_0RCTImageSource *source;
@property (nonatomic, assign) ABI5_0_0RCTResizeMode resizeMode;

@end
