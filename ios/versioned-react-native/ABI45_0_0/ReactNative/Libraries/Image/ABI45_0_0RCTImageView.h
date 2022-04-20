/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <UIKit/UIKit.h>
#import <ABI45_0_0React/ABI45_0_0RCTView.h>
#import <ABI45_0_0React/ABI45_0_0RCTResizeMode.h>

@class ABI45_0_0RCTBridge;
@class ABI45_0_0RCTImageSource;

@interface ABI45_0_0RCTImageView : ABI45_0_0RCTView

- (instancetype)initWithBridge:(ABI45_0_0RCTBridge *)bridge NS_DESIGNATED_INITIALIZER;

@property (nonatomic, assign) UIEdgeInsets capInsets;
@property (nonatomic, strong) UIImage *defaultImage;
@property (nonatomic, assign) UIImageRenderingMode renderingMode;
@property (nonatomic, copy) NSArray<ABI45_0_0RCTImageSource *> *imageSources;
@property (nonatomic, assign) CGFloat blurRadius;
@property (nonatomic, assign) ABI45_0_0RCTResizeMode resizeMode;
@property (nonatomic, copy) NSString *internal_analyticTag;

@end
