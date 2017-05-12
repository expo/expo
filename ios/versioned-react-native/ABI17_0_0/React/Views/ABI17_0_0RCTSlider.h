/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#import <UIKit/UIKit.h>

#import <ReactABI17_0_0/ABI17_0_0RCTComponent.h>

@interface ABI17_0_0RCTSlider : UISlider

@property (nonatomic, copy) ABI17_0_0RCTBubblingEventBlock onValueChange;
@property (nonatomic, copy) ABI17_0_0RCTBubblingEventBlock onSlidingComplete;

@property (nonatomic, assign) float step;
@property (nonatomic, assign) float lastValue;

@property (nonatomic, strong) UIImage *trackImage;
@property (nonatomic, strong) UIImage *minimumTrackImage;
@property (nonatomic, strong) UIImage *maximumTrackImage;

@property (nonatomic, strong) UIImage *thumbImage;


@end
