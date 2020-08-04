/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <UIKit/UIKit.h>

#import <React/RCTComponent.h>

@interface RNCSlider : UISlider

@property (nonatomic, copy) RCTBubblingEventBlock onRNCSliderValueChange;
@property (nonatomic, copy) RCTBubblingEventBlock onRNCSliderSlidingStart;
@property (nonatomic, copy) RCTBubblingEventBlock onRNCSliderSlidingComplete;

@property (nonatomic, assign) float step;
@property (nonatomic, assign) float lastValue;

@property (nonatomic, strong) UIImage *trackImage;
@property (nonatomic, strong) UIImage *minimumTrackImage;
@property (nonatomic, strong) UIImage *maximumTrackImage;
@property (nonatomic, strong) UIImage *thumbImage;
@property (nonatomic, strong) NSString *accessibilityUnits;
@property (nonatomic, strong) NSArray *accessibilityIncrements;

@end
