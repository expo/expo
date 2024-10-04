/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <UIKit/UIKit.h>
#import <ABI42_0_0React/ABI42_0_0RCTView.h>
#import <ABI42_0_0React/ABI42_0_0RCTResizeMode.h>

@class ABI42_0_0RCTBridge;
@class ABI42_0_0RCTImageSource;

@interface ABI42_0_0RCTImageView : ABI42_0_0RCTView

- (instancetype)initWithBridge:(ABI42_0_0RCTBridge *)bridge NS_DESIGNATED_INITIALIZER;

@property (nonatomic, assign) UIEdgeInsets capInsets;
@property (nonatomic, strong) UIImage *defaultImage;
@property (nonatomic, assign) UIImageRenderingMode renderingMode;
@property (nonatomic, copy) NSArray<ABI42_0_0RCTImageSource *> *imageSources;
@property (nonatomic, assign) CGFloat blurRadius;
@property (nonatomic, assign) ABI42_0_0RCTResizeMode resizeMode;

@end
