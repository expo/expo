/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#import <UIKit/UIKit.h>

#import <ReactABI26_0_0/ABI26_0_0RCTResizeMode.h>

@class ABI26_0_0RCTBridge;
@class ABI26_0_0RCTImageSource;

@interface ABI26_0_0RCTImageView : UIImageView

- (instancetype)initWithBridge:(ABI26_0_0RCTBridge *)bridge NS_DESIGNATED_INITIALIZER;

@property (nonatomic, assign) UIEdgeInsets capInsets;
@property (nonatomic, strong) UIImage *defaultImage;
@property (nonatomic, assign) UIImageRenderingMode renderingMode;
@property (nonatomic, copy) NSArray<ABI26_0_0RCTImageSource *> *imageSources;
@property (nonatomic, assign) CGFloat blurRadius;
@property (nonatomic, assign) ABI26_0_0RCTResizeMode resizeMode;

@end
