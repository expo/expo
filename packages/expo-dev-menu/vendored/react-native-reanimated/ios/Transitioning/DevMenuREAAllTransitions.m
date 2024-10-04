#import "RCTConvert+DevMenuREATransition.h"
#import "DevMenuREAAllTransitions.h"
#import <React/RCTViewManager.h>

@interface DevMenuREASnapshotRemover : NSObject <CAAnimationDelegate>
@end

@implementation DevMenuREASnapshotRemover {
  UIView *_view;
}

- (instancetype)initWithView:(UIView *)view;
{
  self = [super init];
  if (self) {
    _view = view;
  }
  return self;
}

- (void)animationDidStop:(CAAnimation *)anim finished:(BOOL)flag
{
  [_view removeFromSuperview];
}

@end

@implementation DevMenuREATransitionGroup

- (instancetype)initWithConfig:(NSDictionary *)config
{
  if (self = [super initWithConfig:config]) {
    _sequence = [RCTConvert BOOL:config[@"sequence"]];
    NSArray *transitions = [RCTConvert NSArray:config[@"transitions"]];
    NSMutableArray<DevMenuREATransition *> *inflated = [NSMutableArray new];
    for (NSDictionary *transitionConfig in transitions) {
      [inflated addObject:[DevMenuREATransition inflate:transitionConfig]];
      inflated.lastObject.parent = self;
    }
    _transitions = inflated;
  }
  return self;
}

- (instancetype)init
{
  if (self = [super init]) {
    _transitions = [NSMutableArray new];
  }
  return self;
}

- (NSArray<DevMenuREATransitionAnimation *> *)
    animationsForTransitioning:(NSMutableDictionary<NSNumber *, DevMenuREATransitionValues *> *)startValues
                     endValues:(NSMutableDictionary<NSNumber *, DevMenuREATransitionValues *> *)endValues
                       forRoot:(UIView *)root
{
  CFTimeInterval delay = self.delay;
  NSMutableArray *animations = [NSMutableArray new];
  for (DevMenuREATransition *transition in _transitions) {
    NSArray *subanims = [transition animationsForTransitioning:startValues endValues:endValues forRoot:root];
    CFTimeInterval finishTime = CACurrentMediaTime();
    for (DevMenuREATransitionAnimation *anim in subanims) {
      [anim delayBy:delay];
      finishTime = MAX(finishTime, anim.finishTime);
    }
    [animations addObjectsFromArray:subanims];
    if (_sequence) {
      delay = finishTime - CACurrentMediaTime();
    }
  }
  return animations;
}

@end

@implementation DevMenuREAVisibilityTransition

- (instancetype)initWithConfig:(NSDictionary *)config
{
  if (self = [super initWithConfig:config]) {
    _animationType = [RCTConvert DevMenuREATransitionAnimationType:config[@"animation"]];
  }
  return self;
}

- (DevMenuREATransitionAnimation *)appearView:(UIView *)view inParent:(UIView *)parent forRoot:(UIView *)root
{
  return nil;
}

- (DevMenuREATransitionAnimation *)disappearView:(UIView *)view fromParent:(UIView *)parent forRoot:(UIView *)root
{
  return nil;
}

- (DevMenuREATransitionAnimation *)animationForTransitioning:(DevMenuREATransitionValues *)startValues
                                            endValues:(DevMenuREATransitionValues *)endValues
                                              forRoot:(UIView *)root
{
  BOOL isViewAppearing = (startValues == nil);
  if (isViewAppearing && !IS_LAYOUT_ONLY(endValues.view)) {
    NSNumber *parentKey = endValues.reactParent.reactTag;
    DevMenuREATransitionValues *parentStartValues = [self findStartValuesForKey:parentKey];
    DevMenuREATransitionValues *parentEndValues = [self findEndValuesForKey:parentKey];
    BOOL isParentAppearing = (parentStartValues == nil && parentEndValues != nil);
    if (!isParentAppearing) {
      return [self appearView:endValues.view inParent:endValues.parent forRoot:root];
    }
  }

  if (endValues == nil && !IS_LAYOUT_ONLY(startValues.view) && startValues.reactParent.window != nil) {
    startValues.view.center = startValues.centerInReactParent;
    return [self disappearView:startValues.view fromParent:startValues.reactParent forRoot:root];
  }
  return nil;
}

@end

@implementation DevMenuREAInTransition
- (instancetype)initWithConfig:(NSDictionary *)config
{
  if (self = [super initWithConfig:config]) {
  }
  return self;
}

- (DevMenuREATransitionAnimation *)appearView:(UIView *)view inParent:(UIView *)parent forRoot:(UIView *)root
{
  CABasicAnimation *animation;
  switch (self.animationType) {
    case DevMenuREATransitionAnimationTypeNone:
      return nil;
    case DevMenuREATransitionAnimationTypeFade: {
      CGFloat finalOpacity = view.layer.opacity;
      animation = [CABasicAnimation animationWithKeyPath:@"opacity"];
      animation.fromValue = @(0.0f);
      animation.toValue = @(finalOpacity);
      break;
    }
    case DevMenuREATransitionAnimationTypeScale: {
      CATransform3D finalTransform = view.layer.transform;
      animation = [CABasicAnimation animationWithKeyPath:@"transform"];
      animation.fromValue = [NSValue valueWithCATransform3D:CATransform3DMakeScale(0.0, 0.0, 0)];
      animation.toValue = [NSValue valueWithCATransform3D:finalTransform];
      break;
    }
    case DevMenuREATransitionAnimationTypeSlideTop:
    case DevMenuREATransitionAnimationTypeSlideBottom:
    case DevMenuREATransitionAnimationTypeSlideLeft:
    case DevMenuREATransitionAnimationTypeSlideRight: {
      CGPoint finalPosition = view.layer.position;
      CGPoint startPosition = finalPosition;
      switch (self.animationType) {
        case DevMenuREATransitionAnimationTypeSlideTop:
          startPosition.y -= root.frame.size.height;
          break;
        case DevMenuREATransitionAnimationTypeSlideBottom:
          startPosition.y += root.frame.size.height;
          break;
        case DevMenuREATransitionAnimationTypeSlideLeft:
          startPosition.x -= root.frame.size.width;
          break;
        case DevMenuREATransitionAnimationTypeSlideRight:
          startPosition.x += root.frame.size.width;
          break;
      }
      animation = [CABasicAnimation animationWithKeyPath:@"position"];
      animation.fromValue = @(startPosition);
      animation.toValue = @(finalPosition);
      break;
    }
  }
  animation.fillMode = kCAFillModeBackwards;

  return [DevMenuREATransitionAnimation transitionWithAnimation:animation layer:view.layer andKeyPath:animation.keyPath];
}
@end

@implementation DevMenuREAOutTransition
- (instancetype)initWithConfig:(NSDictionary *)config
{
  if (self = [super initWithConfig:config]) {
  }
  return self;
}

- (DevMenuREATransitionAnimation *)disappearView:(UIView *)view fromParent:(UIView *)parent forRoot:(UIView *)root
{
  if (self.animationType == DevMenuREATransitionAnimationTypeNone) {
    return nil;
  }
  // Add view back to parent temporarily in order to take snapshot
  [parent addSubview:view];
  UIView *snapshotView = [view snapshotViewAfterScreenUpdates:NO];
  [view removeFromSuperview];
  snapshotView.frame = view.frame;
  [parent addSubview:snapshotView];
  CALayer *snapshot = snapshotView.layer;

  CABasicAnimation *animation;
  switch (self.animationType) {
    case DevMenuREATransitionAnimationTypeFade: {
      CGFloat fromValue = snapshot.opacity;
      snapshot.opacity = 0.0f;
      animation = [CABasicAnimation animationWithKeyPath:@"opacity"];
      animation.fromValue = @(fromValue);
      animation.toValue = @(0.0f);
      break;
    }
    case DevMenuREATransitionAnimationTypeScale: {
      CATransform3D fromValue = snapshot.transform;
      snapshot.transform = CATransform3DMakeScale(0.001, 0.001, 0.001);
      animation = [CABasicAnimation animationWithKeyPath:@"transform"];
      animation.fromValue = [NSValue valueWithCATransform3D:fromValue];
      animation.toValue = [NSValue valueWithCATransform3D:CATransform3DMakeScale(0.001, 0.001, 0.001)];
      break;
    }
    case DevMenuREATransitionAnimationTypeSlideTop:
    case DevMenuREATransitionAnimationTypeSlideBottom:
    case DevMenuREATransitionAnimationTypeSlideLeft:
    case DevMenuREATransitionAnimationTypeSlideRight: {
      CGPoint startPosition = snapshot.position;
      CGPoint finalPosition = startPosition;
      switch (self.animationType) {
        case DevMenuREATransitionAnimationTypeSlideTop:
          finalPosition.y -= root.frame.size.height;
          break;
        case DevMenuREATransitionAnimationTypeSlideBottom:
          finalPosition.y += root.frame.size.height;
          break;
        case DevMenuREATransitionAnimationTypeSlideLeft:
          finalPosition.x -= root.frame.size.width;
          break;
        case DevMenuREATransitionAnimationTypeSlideRight:
          finalPosition.x += root.frame.size.width;
          break;
      }
      snapshot.position = finalPosition;
      animation = [CABasicAnimation animationWithKeyPath:@"position"];
      animation.fromValue = @(startPosition);
      animation.toValue = @(finalPosition);
      break;
    }
  }
  animation.fillMode = kCAFillModeBackwards;
  animation.delegate = [[DevMenuREASnapshotRemover alloc] initWithView:snapshotView];

  return [DevMenuREATransitionAnimation transitionWithAnimation:animation layer:snapshot andKeyPath:animation.keyPath];
}
@end

@implementation DevMenuREAChangeTransition

- (DevMenuREATransitionAnimation *)animationForTransitioning:(DevMenuREATransitionValues *)startValues
                                            endValues:(DevMenuREATransitionValues *)endValues
                                              forRoot:(UIView *)root
{
  if (startValues == nil || endValues == nil || endValues.view.window == nil) {
    return nil;
  }
  BOOL animatePosition = !CGPointEqualToPoint(startValues.center, endValues.center);
  BOOL animateBounds = !CGRectEqualToRect(startValues.bounds, endValues.bounds);

  if (!animatePosition && !animateBounds) {
    return nil;
  }

  CALayer *layer = endValues.view.layer;

  CAAnimationGroup *group = [CAAnimationGroup animation];
  group.fillMode = kCAFillModeBackwards;

  NSMutableArray *animations = [NSMutableArray new];

  if (animatePosition) {
    CGPoint fromValue = layer.presentationLayer.position;
    CABasicAnimation *animation = [CABasicAnimation animationWithKeyPath:@"position"];
    animation.fromValue = [NSValue valueWithCGPoint:fromValue];
    animation.toValue = [NSValue valueWithCGPoint:endValues.center];
    [animations addObject:animation];
  }

  if (animateBounds) {
    CGRect fromValue = layer.presentationLayer.bounds;
    CABasicAnimation *animation = [CABasicAnimation animationWithKeyPath:@"bounds"];
    animation.fromValue = [NSValue valueWithCGRect:fromValue];
    animation.toValue = [NSValue valueWithCGRect:endValues.bounds];
    [animations addObject:animation];
  }

  group.animations = animations;
  return [DevMenuREATransitionAnimation transitionWithAnimation:group layer:layer andKeyPath:nil];
}
@end
