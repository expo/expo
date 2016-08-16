/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#import <UIKit/UIKit.h>
#import "ABI5_0_0RCTImageComponent.h"
#import "ABI5_0_0RCTResizeMode.h"

@class ABI5_0_0RCTBridge;
@class ABI5_0_0RCTImageSource;

@interface ABI5_0_0RCTImageView : UIImageView <ABI5_0_0RCTImageComponent>

- (instancetype)initWithBridge:(ABI5_0_0RCTBridge *)bridge NS_DESIGNATED_INITIALIZER;

@property (nonatomic, assign) UIEdgeInsets capInsets;
@property (nonatomic, strong) UIImage *defaultImage;
@property (nonatomic, assign) UIImageRenderingMode renderingMode;
@property (nonatomic, strong) ABI5_0_0RCTImageSource *source;
@property (nonatomic, assign) CGFloat blurRadius;

@end
