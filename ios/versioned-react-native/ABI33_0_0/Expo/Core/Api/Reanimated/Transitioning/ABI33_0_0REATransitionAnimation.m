#import <UIKit/UIKit.h>

#import "ABI33_0_0REATransitionAnimation.h"

#define DEFAULT_DURATION 0.25

@implementation ABI33_0_0REATransitionAnimation

+ (ABI33_0_0REATransitionAnimation *)transitionWithAnimation:(CAAnimation *)animation
                                                 layer:(CALayer *)layer
                                            andKeyPath:(NSString*)keyPath;
{
  ABI33_0_0REATransitionAnimation *anim = [ABI33_0_0REATransitionAnimation new];
  anim.animation = animation;
  anim.layer = layer;
  anim.keyPath = keyPath;
  return anim;
}

- (void)play
{
  [_layer addAnimation:_animation forKey:_keyPath];
}

- (void)delayBy:(CFTimeInterval)delay
{
  if (delay <= 0) {
    return;
  }
  if (_animation.beginTime == 0) {
    _animation.beginTime = CACurrentMediaTime() + delay;
  } else {
    _animation.beginTime += delay;
  }
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
    return CACurrentMediaTime() + self.duration;
  }
  return _animation.beginTime + self.duration;
}

@end
