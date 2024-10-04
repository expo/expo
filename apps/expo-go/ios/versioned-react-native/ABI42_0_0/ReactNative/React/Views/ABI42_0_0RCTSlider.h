/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <UIKit/UIKit.h>

#import <ABI42_0_0React/ABI42_0_0RCTComponent.h>

@interface ABI42_0_0RCTSlider : UISlider

@property (nonatomic, copy) ABI42_0_0RCTBubblingEventBlock onValueChange;
@property (nonatomic, copy) ABI42_0_0RCTDirectEventBlock onSlidingComplete;

@property (nonatomic, assign) float step;
@property (nonatomic, assign) float lastValue;

@property (nonatomic, strong) UIImage *trackImage;
@property (nonatomic, strong) UIImage *minimumTrackImage;
@property (nonatomic, strong) UIImage *maximumTrackImage;

@property (nonatomic, strong) UIImage *thumbImage;

@end
