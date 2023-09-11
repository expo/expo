#import <ABI47_0_0RNReanimated/ABI47_0_0RCTConvert+REATransition.h>
#import <ABI47_0_0RNReanimated/ABI47_0_0REAAllTransitions.h>
#import <ABI47_0_0React/ABI47_0_0RCTViewManager.h>

@interface ABI47_0_0REASnapshotRemover : NSObject <CAAnimationDelegate>
@end

@implementation ABI47_0_0REASnapshotRemover {
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

@implementation ABI47_0_0REATransitionGroup

- (instancetype)initWithConfig:(NSDictionary *)config
{
  if (self = [super initWithConfig:config]) {
    _sequence = [ABI47_0_0RCTConvert BOOL:config[@"sequence"]];
    NSArray *transitions = [ABI47_0_0RCTConvert NSArray:config[@"transitions"]];
    NSMutableArray<ABI47_0_0REATransition *> *inflated = [NSMutableArray new];
    for (NSDictionary *transitionConfig in transitions) {
      [inflated addObject:[ABI47_0_0REATransition inflate:transitionConfig]];
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

- (NSArray<ABI47_0_0REATransitionAnimation *> *)
    animationsForTransitioning:(NSMutableDictionary<NSNumber *, ABI47_0_0REATransitionValues *> *)startValues
                     endValues:(NSMutableDictionary<NSNumber *, ABI47_0_0REATransitionValues *> *)endValues
                       forRoot:(UIView *)root
{
  CFTimeInterval delay = self.delay;
  NSMutableArray *animations = [NSMutableArray new];
  for (ABI47_0_0REATransition *transition in _transitions) {
    NSArray *subanims = [transition animationsForTransitioning:startValues endValues:endValues forRoot:root];
    CFTimeInterval finishTime = CACurrentMediaTime();
    for (ABI47_0_0REATransitionAnimation *anim in subanims) {
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

@implementation ABI47_0_0REAVisibilityTransition

- (instancetype)initWithConfig:(NSDictionary *)config
{
  if (self = [super initWithConfig:config]) {
    _animationType = [ABI47_0_0RCTConvert ABI47_0_0REATransitionAnimationType:config[@"animation"]];
  }
  return self;
}

- (ABI47_0_0REATransitionAnimation *)appearView:(UIView *)view inParent:(UIView *)parent forRoot:(UIView *)root
{
  return nil;
}

- (ABI47_0_0REATransitionAnimation *)disappearView:(UIView *)view fromParent:(UIView *)parent forRoot:(UIView *)root
{
  return nil;
}

- (ABI47_0_0REATransitionAnimation *)animationForTransitioning:(ABI47_0_0REATransitionValues *)startValues
                                            endValues:(ABI47_0_0REATransitionValues *)endValues
                                              forRoot:(UIView *)root
{
  BOOL isViewAppearing = (startValues == nil);
  if (isViewAppearing && !IS_LAYOUT_ONLY(endValues.view)) {
    NSNumber *parentKey = endValues.reactParent.ABI47_0_0ReactTag;
    ABI47_0_0REATransitionValues *parentStartValues = [self findStartValuesForKey:parentKey];
    ABI47_0_0REATransitionValues *parentEndValues = [self findEndValuesForKey:parentKey];
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

@implementation ABI47_0_0REAInTransition
- (instancetype)initWithConfig:(NSDictionary *)config
{
  if (self = [super initWithConfig:config]) {
  }
  return self;
}

- (ABI47_0_0REATransitionAnimation *)appearView:(UIView *)view inParent:(UIView *)parent forRoot:(UIView *)root
{
  CABasicAnimation *animation;
  switch (self.animationType) {
    case ABI47_0_0REATransitionAnimationTypeNone:
      return nil;
    case ABI47_0_0REATransitionAnimationTypeFade: {
      CGFloat finalOpacity = view.layer.opacity;
      animation = [CABasicAnimation animationWithKeyPath:@"opacity"];
      animation.fromValue = @(0.0f);
      animation.toValue = @(finalOpacity);
      break;
    }
    case ABI47_0_0REATransitionAnimationTypeScale: {
      CATransform3D finalTransform = view.layer.transform;
      animation = [CABasicAnimation animationWithKeyPath:@"transform"];
      animation.fromValue = [NSValue valueWithCATransform3D:CATransform3DMakeScale(0.0, 0.0, 0)];
      animation.toValue = [NSValue valueWithCATransform3D:finalTransform];
      break;
    }
    case ABI47_0_0REATransitionAnimationTypeSlideTop:
    case ABI47_0_0REATransitionAnimationTypeSlideBottom:
    case ABI47_0_0REATransitionAnimationTypeSlideLeft:
    case ABI47_0_0REATransitionAnimationTypeSlideRight: {
      CGPoint finalPosition = view.layer.position;
      CGPoint startPosition = finalPosition;
      switch (self.animationType) {
        case ABI47_0_0REATransitionAnimationTypeSlideTop:
          startPosition.y -= root.frame.size.height;
          break;
        case ABI47_0_0REATransitionAnimationTypeSlideBottom:
          startPosition.y += root.frame.size.height;
          break;
        case ABI47_0_0REATransitionAnimationTypeSlideLeft:
          startPosition.x -= root.frame.size.width;
          break;
        case ABI47_0_0REATransitionAnimationTypeSlideRight:
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

  return [ABI47_0_0REATransitionAnimation transitionWithAnimation:animation layer:view.layer andKeyPath:animation.keyPath];
}
@end

@implementation ABI47_0_0REAOutTransition
- (instancetype)initWithConfig:(NSDictionary *)config
{
  if (self = [super initWithConfig:config]) {
  }
  return self;
}

- (ABI47_0_0REATransitionAnimation *)disappearView:(UIView *)view fromParent:(UIView *)parent forRoot:(UIView *)root
{
  if (self.animationType == ABI47_0_0REATransitionAnimationTypeNone) {
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
    case ABI47_0_0REATransitionAnimationTypeFade: {
      CGFloat fromValue = snapshot.opacity;
      snapshot.opacity = 0.0f;
      animation = [CABasicAnimation animationWithKeyPath:@"opacity"];
      animation.fromValue = @(fromValue);
      animation.toValue = @(0.0f);
      break;
    }
    case ABI47_0_0REATransitionAnimationTypeScale: {
      CATransform3D fromValue = snapshot.transform;
      snapshot.transform = CATransform3DMakeScale(0.001, 0.001, 0.001);
      animation = [CABasicAnimation animationWithKeyPath:@"transform"];
      animation.fromValue = [NSValue valueWithCATransform3D:fromValue];
      animation.toValue = [NSValue valueWithCATransform3D:CATransform3DMakeScale(0.001, 0.001, 0.001)];
      break;
    }
    case ABI47_0_0REATransitionAnimationTypeSlideTop:
    case ABI47_0_0REATransitionAnimationTypeSlideBottom:
    case ABI47_0_0REATransitionAnimationTypeSlideLeft:
    case ABI47_0_0REATransitionAnimationTypeSlideRight: {
      CGPoint startPosition = snapshot.position;
      CGPoint finalPosition = startPosition;
      switch (self.animationType) {
        case ABI47_0_0REATransitionAnimationTypeSlideTop:
          finalPosition.y -= root.frame.size.height;
          break;
        case ABI47_0_0REATransitionAnimationTypeSlideBottom:
          finalPosition.y += root.frame.size.height;
          break;
        case ABI47_0_0REATransitionAnimationTypeSlideLeft:
          finalPosition.x -= root.frame.size.width;
          break;
        case ABI47_0_0REATransitionAnimationTypeSlideRight:
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
  animation.delegate = [[ABI47_0_0REASnapshotRemover alloc] initWithView:snapshotView];

  return [ABI47_0_0REATransitionAnimation transitionWithAnimation:animation layer:snapshot andKeyPath:animation.keyPath];
}
@end

@implementation ABI47_0_0REAChangeTransition

- (ABI47_0_0REATransitionAnimation *)animationForTransitioning:(ABI47_0_0REATransitionValues *)startValues
                                            endValues:(ABI47_0_0REATransitionValues *)endValues
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
  return [ABI47_0_0REATransitionAnimation transitionWithAnimation:group layer:layer andKeyPath:nil];
}
@end
