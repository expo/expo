#import <UIKit/UIKit.h>

#import "REATransitionAnimation.h"

#define DEFAULT_DURATION 0.25

@implementation REATransitionAnimation

+ (REATransitionAnimation *)transitionWithAnimation:(CAAnimation *)animation
                                                 layer:(CALayer *)layer
                                            andKeyPath:(NSString*)keyPath;
{
  REATransitionAnimation *anim = [REATransitionAnimation new];
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
