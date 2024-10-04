/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <ABI42_0_0React/ABI42_0_0RCTSpringAnimation.h>

#import <UIKit/UIKit.h>

#import <ABI42_0_0React/ABI42_0_0RCTConvert.h>
#import <ABI42_0_0React/ABI42_0_0RCTDefines.h>

#import <ABI42_0_0React/ABI42_0_0RCTAnimationUtils.h>
#import <ABI42_0_0React/ABI42_0_0RCTValueAnimatedNode.h>

@interface ABI42_0_0RCTSpringAnimation ()

@property (nonatomic, strong) NSNumber *animationId;
@property (nonatomic, strong) ABI42_0_0RCTValueAnimatedNode *valueNode;
@property (nonatomic, assign) BOOL animationHasBegun;
@property (nonatomic, assign) BOOL animationHasFinished;

@end

const NSTimeInterval ABI42_0_0MAX_DELTA_TIME = 0.064;

@implementation ABI42_0_0RCTSpringAnimation
{
  CGFloat _toValue;
  CGFloat _fromValue;
  BOOL _overshootClamping;
  CGFloat _restDisplacementThreshold;
  CGFloat _restSpeedThreshold;
  CGFloat _stiffness;
  CGFloat _damping;
  CGFloat _mass;
  CGFloat _initialVelocity;
  NSTimeInterval _animationStartTime;
  NSTimeInterval _animationCurrentTime;
  ABI42_0_0RCTResponseSenderBlock _callback;

  CGFloat _lastPosition;
  CGFloat _lastVelocity;

  NSInteger _iterations;
  NSInteger _currentLoop;

  NSTimeInterval _t; // Current time (startTime + dt)
}

- (instancetype)initWithId:(NSNumber *)animationId
                    config:(NSDictionary *)config
                   forNode:(ABI42_0_0RCTValueAnimatedNode *)valueNode
                  callBack:(nullable ABI42_0_0RCTResponseSenderBlock)callback
{
  if ((self = [super init])) {
    _animationId = animationId;
    _lastPosition = valueNode.value;
    _valueNode = valueNode;
    _lastVelocity = [ABI42_0_0RCTConvert CGFloat:config[@"initialVelocity"]];
    _callback = [callback copy];
    [self resetAnimationConfig:config];
  }
  return self;
}

- (void)resetAnimationConfig:(NSDictionary *)config
{
  NSNumber *iterations = [ABI42_0_0RCTConvert NSNumber:config[@"iterations"]] ?: @1;
  _toValue = [ABI42_0_0RCTConvert CGFloat:config[@"toValue"]];
  _overshootClamping = [ABI42_0_0RCTConvert BOOL:config[@"overshootClamping"]];
  _restDisplacementThreshold = [ABI42_0_0RCTConvert CGFloat:config[@"restDisplacementThreshold"]];
  _restSpeedThreshold = [ABI42_0_0RCTConvert CGFloat:config[@"restSpeedThreshold"]];
  _stiffness = [ABI42_0_0RCTConvert CGFloat:config[@"stiffness"]];
  _damping = [ABI42_0_0RCTConvert CGFloat:config[@"damping"]];
  _mass = [ABI42_0_0RCTConvert CGFloat:config[@"mass"]];
  _initialVelocity = _lastVelocity;
  _fromValue = _lastPosition;
  _fromValue = _lastPosition;
  _lastVelocity = _initialVelocity;
  _animationHasFinished = iterations.integerValue == 0;
  _iterations = iterations.integerValue;
  _currentLoop = 1;
  _animationStartTime = _animationCurrentTime = -1;
  _animationHasBegun = YES;
}

ABI42_0_0RCT_NOT_IMPLEMENTED(- (instancetype)init)

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
  if (!_animationHasBegun || _animationHasFinished) {
    // Animation has not begun or animation has already finished.
    return;
  }

  // calculate delta time
  if(_animationStartTime == -1) {
    _t = 0.0;
    _animationStartTime = currentTime;
  } else {
    // Handle frame drops, and only advance dt by a max of ABI42_0_0MAX_DELTA_TIME
    NSTimeInterval deltaTime = MIN(ABI42_0_0MAX_DELTA_TIME, currentTime - _animationCurrentTime);
    _t = _t + deltaTime / ABI42_0_0RCTAnimationDragCoefficient();
  }

  // store the timestamp
  _animationCurrentTime = currentTime;

  CGFloat c = _damping;
  CGFloat m = _mass;
  CGFloat k = _stiffness;
  CGFloat v0 = -_initialVelocity;

  CGFloat zeta = c / (2 * sqrtf(k * m));
  CGFloat omega0 = sqrtf(k / m);
  CGFloat omega1 = omega0 * sqrtf(1.0 - (zeta * zeta));
  CGFloat x0 = _toValue - _fromValue;

  CGFloat position;
  CGFloat velocity;
  if (zeta < 1) {
    // Under damped
    CGFloat envelope = expf(-zeta * omega0 * _t);
    position =
      _toValue -
      envelope *
      ((v0 + zeta * omega0 * x0) / omega1 * sinf(omega1 * _t) +
        x0 * cosf(omega1 * _t));
    // This looks crazy -- it's actually just the derivative of the
    // oscillation function
    velocity =
      zeta *
        omega0 *
        envelope *
        (sinf(omega1 * _t) * (v0 + zeta * omega0 * x0) / omega1 +
          x0 * cosf(omega1 * _t)) -
      envelope *
        (cosf(omega1 * _t) * (v0 + zeta * omega0 * x0) -
          omega1 * x0 * sinf(omega1 * _t));
  } else {
    CGFloat envelope = expf(-omega0 * _t);
    position = _toValue - envelope * (x0 + (v0 + omega0 * x0) * _t);
    velocity =
      envelope * (v0 * (_t * omega0 - 1) + _t * x0 * (omega0 * omega0));
  }

  _lastPosition = position;
  _lastVelocity = velocity;

  [self onUpdate:position];

  // Conditions for stopping the spring animation
  BOOL isOvershooting = NO;
  if (_overshootClamping && _stiffness != 0) {
    if (_fromValue < _toValue) {
      isOvershooting = position > _toValue;
    } else {
      isOvershooting = position < _toValue;
    }
  }
  BOOL isVelocity = ABS(velocity) <= _restSpeedThreshold;
  BOOL isDisplacement = YES;
  if (_stiffness != 0) {
    isDisplacement = ABS(_toValue - position) <= _restDisplacementThreshold;
  }

  if (isOvershooting || (isVelocity && isDisplacement)) {
    if (_stiffness != 0) {
      // Ensure that we end up with a round value
      if (_animationHasFinished) {
        return;
      }
      [self onUpdate:_toValue];
    }

    if (_iterations == -1 || _currentLoop < _iterations) {
      _lastPosition = _fromValue;
      _lastVelocity = _initialVelocity;
      // Set _animationStartTime to -1 to reset instance variables on the next animation step.
      _animationStartTime = -1;
      _currentLoop++;
      [self onUpdate:_fromValue];
    } else {
      _animationHasFinished = YES;
    }
  }
}

- (void)onUpdate:(CGFloat)outputValue
{
  _valueNode.value = outputValue;
  [_valueNode setNeedsUpdate];
}

@end
