#import <RNReanimated/REATransitionAnimation.h>
#import <UIKit/UIKit.h>

#define DEFAULT_DURATION 0.25

#if TARGET_IPHONE_SIMULATOR
// Based on https://stackoverflow.com/a/13307674
float UIAnimationDragCoefficient(void);
#endif

CGFloat SimAnimationDragCoefficient()
{
#if TARGET_IPHONE_SIMULATOR
  if (NSClassFromString(@"XCTest") != nil) {
    // UIAnimationDragCoefficient is 10.0 in tests for some reason, but
    // we need it to be 1.0.
    return 1.0;
  } else {
    return (CGFloat)UIAnimationDragCoefficient();
  }
#else
  return 1.0;
#endif
}

@implementation REATransitionAnimation {
  NSTimeInterval _delay;
}

+ (REATransitionAnimation *)transitionWithAnimation:(CAAnimation *)animation
                                              layer:(CALayer *)layer
                                         andKeyPath:(NSString *)keyPath;
{
  REATransitionAnimation *anim = [REATransitionAnimation new];
  anim.animation = animation;
  anim.layer = layer;
  anim.keyPath = keyPath;
  return anim;
}

- (void)play
{
  /*
  CACurrentMediaTime introduces some kind of delay  even if _delay is set to 0
  it calls mach_absolute_time() which is based on the last time the device booted
  which might cause the delay
  */
  if (_delay > 0) {
    _animation.beginTime = CACurrentMediaTime() + _delay * SimAnimationDragCoefficient();
  }
  _animation.duration = self.duration * SimAnimationDragCoefficient();
  [_layer addAnimation:_animation forKey:_keyPath];
}

- (void)delayBy:(CFTimeInterval)delay
{
  if (delay <= 0) {
    return;
  }
  _delay += delay;
}

- (CFTimeInterval)duration
{
  if (_animation.duration == 0) {
    return DEFAULT_DURATION;
  }
  return _animation.duration;
}

- (CFTimeInterval)finishTime
{
  if (_animation.beginTime == 0) {
    return CACurrentMediaTime() + self.duration + _delay;
  }
  return _animation.beginTime + self.duration + _delay;
}

@end
