/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#import "ABI17_0_0RCTFrameAnimation.h"

#import <UIKit/UIKit.h>

#import <ReactABI17_0_0/ABI17_0_0RCTConvert.h>
#import <ReactABI17_0_0/ABI17_0_0RCTDefines.h>

#import "ABI17_0_0RCTAnimationUtils.h"
#import "ABI17_0_0RCTValueAnimatedNode.h"

const double SINGLE_FRAME_INTERVAL = 1.0 / 60.0;

@interface ABI17_0_0RCTFrameAnimation ()

@property (nonatomic, strong) NSNumber *animationId;
@property (nonatomic, strong) ABI17_0_0RCTValueAnimatedNode *valueNode;
@property (nonatomic, assign) BOOL animationHasBegun;
@property (nonatomic, assign) BOOL animationHasFinished;

@end

@implementation ABI17_0_0RCTFrameAnimation
{
  NSArray<NSNumber *> *_frames;
  CGFloat _toValue;
  CGFloat _fromValue;
  NSTimeInterval _animationStartTime;
  NSTimeInterval _animationCurrentTime;
  ABI17_0_0RCTResponseSenderBlock _callback;
}

- (instancetype)initWithId:(NSNumber *)animationId
                    config:(NSDictionary *)config
                   forNode:(ABI17_0_0RCTValueAnimatedNode *)valueNode
                  callBack:(nullable ABI17_0_0RCTResponseSenderBlock)callback;
{
  if ((self = [super init])) {
    NSNumber *toValue = [ABI17_0_0RCTConvert NSNumber:config[@"toValue"]] ?: @1;
    NSArray<NSNumber *> *frames = [ABI17_0_0RCTConvert NSNumberArray:config[@"frames"]];

    _animationId = animationId;
    _toValue = toValue.floatValue;
    _fromValue = valueNode.value;
    _valueNode = valueNode;
    _frames = [frames copy];
    _callback = [callback copy];
  }
  return self;
}

ABI17_0_0RCT_NOT_IMPLEMENTED(- (instancetype)init)

- (void)startAnimation
{
  _animationStartTime = _animationCurrentTime = -1;
  _animationHasBegun = YES;
}

- (void)stopAnimation
{
  _valueNode = nil;
  if (_callback) {
    _callback(@[@{
      @"finished": @(_animationHasFinished)
    }]);
  }
}

- (void)stepAnimationWithTime:(NSTimeInterval)currentTime
{
  if (!_animationHasBegun || _animationHasFinished || _frames.count == 0) {
    // Animation has not begun or animation has already finished.
    return;
  }

  if (_animationStartTime == -1) {
    _animationStartTime = _animationCurrentTime = currentTime;
  }

  _animationCurrentTime = currentTime;
  NSTimeInterval currentDuration = _animationCurrentTime - _animationStartTime;

  // Determine how many frames have passed since last update.
  // Get index of frames that surround the current interval
  NSUInteger startIndex = floor(currentDuration / SINGLE_FRAME_INTERVAL);
  NSUInteger nextIndex = startIndex + 1;

  if (nextIndex >= _frames.count) {
    // We are at the end of the animation
    // Update value and flag animation has ended.
    NSNumber *finalValue = _frames.lastObject;
    [self updateOutputWithFrameOutput:finalValue.doubleValue];
    _animationHasFinished = YES;
    return;
  }

  // Do a linear remap of the two frames to safegaurd against variable framerates
  NSNumber *fromFrameValue = _frames[startIndex];
  NSNumber *toFrameValue = _frames[nextIndex];
  NSTimeInterval fromInterval = startIndex * SINGLE_FRAME_INTERVAL;
  NSTimeInterval toInterval = nextIndex * SINGLE_FRAME_INTERVAL;

  // Interpolate between the individual frames to ensure the animations are
  //smooth and of the proper duration regardless of the framerate.
  CGFloat frameOutput = ABI17_0_0RCTInterpolateValue(currentDuration,
                                            fromInterval,
                                            toInterval,
                                            fromFrameValue.doubleValue,
                                            toFrameValue.doubleValue,
                                            ABI17_0_0EXTRAPOLATE_TYPE_EXTEND,
                                            ABI17_0_0EXTRAPOLATE_TYPE_EXTEND);

  [self updateOutputWithFrameOutput:frameOutput];
}

- (void)updateOutputWithFrameOutput:(CGFloat)frameOutput
{
  CGFloat outputValue = ABI17_0_0RCTInterpolateValue(frameOutput,
                                            0,
                                            1,
                                            _fromValue,
                                            _toValue,
                                            ABI17_0_0EXTRAPOLATE_TYPE_EXTEND,
                                            ABI17_0_0EXTRAPOLATE_TYPE_EXTEND);

  _valueNode.value = outputValue;
  [_valueNode setNeedsUpdate];
}

@end
