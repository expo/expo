/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <UIKit/UIKit.h>

#import <ABI47_0_0React/ABI47_0_0RCTComponent.h>

@interface ABI47_0_0RNCSlider : UISlider

@property (nonatomic, copy) ABI47_0_0RCTBubblingEventBlock onRNCSliderValueChange;
@property (nonatomic, copy) ABI47_0_0RCTBubblingEventBlock onRNCSliderSlidingStart;
@property (nonatomic, copy) ABI47_0_0RCTBubblingEventBlock onRNCSliderSlidingComplete;

@property (nonatomic, assign) float step;
@property (nonatomic, assign) float lastValue;
@property (nonatomic, assign) bool isSliding;

@property (nonatomic, strong) UIImage *trackImage;
@property (nonatomic, strong) UIImage *minimumTrackImage;
@property (nonatomic, strong) UIImage *maximumTrackImage;
@property (nonatomic, strong) UIImage *thumbImage;
@property (nonatomic, assign) bool tapToSeek;
@property (nonatomic, strong) NSString *accessibilityUnits;
@property (nonatomic, strong) NSArray *accessibilityIncrements;

- (float) discreteValue:(float)value;

@end
