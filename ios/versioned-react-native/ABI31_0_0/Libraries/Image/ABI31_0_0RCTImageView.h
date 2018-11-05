/**
 * Copyright (c) 2015-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <UIKit/UIKit.h>

#import <ReactABI31_0_0/ABI31_0_0RCTResizeMode.h>

@class ABI31_0_0RCTBridge;
@class ABI31_0_0RCTImageSource;

@interface ABI31_0_0RCTImageView : UIImageView

- (instancetype)initWithBridge:(ABI31_0_0RCTBridge *)bridge NS_DESIGNATED_INITIALIZER;

@property (nonatomic, assign) UIEdgeInsets capInsets;
@property (nonatomic, strong) UIImage *defaultImage;
@property (nonatomic, assign) UIImageRenderingMode renderingMode;
@property (nonatomic, copy) NSArray<ABI31_0_0RCTImageSource *> *imageSources;
@property (nonatomic, assign) CGFloat blurRadius;
@property (nonatomic, assign) ABI31_0_0RCTResizeMode resizeMode;

@end
