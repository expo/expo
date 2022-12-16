#import <QuartzCore/QuartzCore.h>
#import "RCTConvert+DevMenuREATransition.h"
#import "DevMenuREATransition.h"
#import "DevMenuREATransitionValues.h"
#import <React/RCTConvert.h>
#import <React/RCTViewManager.h>
#import <UIKit/UIKit.h>

#define DEFAULT_PROPAGATION_SPEED 3

@interface DevMenuREATransitionGroup : DevMenuREATransition
@property (nonatomic) BOOL sequence;
@property (nonatomic) NSArray *transitions;
- (instancetype)initWithConfig:(NSDictionary *)config;
@end

@interface DevMenuREAVisibilityTransition : DevMenuREATransition
@property (nonatomic) DevMenuREATransitionAnimationType animationType;
- (DevMenuREATransitionAnimation *)appearView:(UIView *)view inParent:(UIView *)parent;
- (DevMenuREATransitionAnimation *)disappearView:(UIView *)view fromParent:(UIView *)parent;
- (instancetype)initWithConfig:(NSDictionary *)config;
@end

@interface DevMenuREAInTransition : DevMenuREAVisibilityTransition
- (instancetype)initWithConfig:(NSDictionary *)config;
@end

@interface DevMenuREAOutTransition : DevMenuREAVisibilityTransition
- (instancetype)initWithConfig:(NSDictionary *)config;
@end

@interface DevMenuREAChangeTransition : DevMenuREATransition
- (instancetype)initWithConfig:(NSDictionary *)config;
@end

@implementation DevMenuREATransition {
  __weak UIView *_root;
  NSMutableDictionary<NSNumber *, DevMenuREATransitionValues *> *_startValues;
  NSMutableDictionary<NSNumber *, DevMenuREATransitionValues *> *_endValues;
}

+ (DevMenuREATransition *)inflate:(NSDictionary *)config
{
  DevMenuREATransitionType type = [RCTConvert DevMenuREATransitionType:config[@"type"]];
  switch (type) {
    case DevMenuREATransitionTypeGroup:
      return [[DevMenuREATransitionGroup alloc] initWithConfig:config];
    case DevMenuREATransitionTypeIn:
      return [[DevMenuREAInTransition alloc] initWithConfig:config];
    case DevMenuREATransitionTypeOut:
      return [[DevMenuREAOutTransition alloc] initWithConfig:config];
    case DevMenuREATransitionTypeChange:
      return [[DevMenuREAChangeTransition alloc] initWithConfig:config];
    case DevMenuREATransitionTypeNone:
    default:
      RCTLogError(@"Invalid transitioning type %@", config[@"type"]);
  }
  return nil;
}

- (instancetype)initWithConfig:(NSDictionary *)config
{
  if (self = [super init]) {
    _duration = [RCTConvert double:config[@"durationMs"]] / 1000.0;
    _delay = [RCTConvert double:config[@"delayMs"]] / 1000.0;
    _interpolation = [RCTConvert DevMenuREATransitionInterpolationType:config[@"interpolation"]];
    _propagation = [RCTConvert DevMenuREATransitionPropagationType:config[@"propagation"]];
  }
  return self;
}

- (void)captureRecursiveIn:(UIView *)view
                        to:(NSMutableDictionary<NSNumber *, DevMenuREATransitionValues *> *)map
                   forRoot:(UIView *)root
{
  NSNumber *tag = view.reactTag;
  if (tag != nil) {
    map[tag] = [[DevMenuREATransitionValues alloc] initWithView:view forRoot:root];
    for (UIView *subview in view.reactSubviews) {
      [self captureRecursiveIn:subview to:map forRoot:root];
    }
  }
}

- (void)startCaptureInRoot:(UIView *)root
{
  _startValues = [NSMutableDictionary new];
  [self captureRecursiveIn:root to:_startValues forRoot:root];
}

- (void)playInRoot:(UIView *)root
{
  _endValues = [NSMutableDictionary new];
  [self captureRecursiveIn:root to:_endValues forRoot:root];
  NSArray *animations = [self animationsForTransitioning:_startValues endValues:_endValues forRoot:root];
  for (DevMenuREATransitionAnimation *animation in animations) {
    [animation play];
  }
  _startValues = nil;
  _endValues = nil;
}

- (DevMenuREATransitionValues *)findStartValuesForKey:(NSNumber *)key
{
  if (_parent != nil) {
    return [_parent findStartValuesForKey:key];
  }
  return _startValues[key];
}

- (DevMenuREATransitionValues *)findEndValuesForKey:(NSNumber *)key
{
  if (_parent != nil) {
    return [_parent findEndValuesForKey:key];
  }
  return _endValues[key];
}

- (CFTimeInterval)propagationDelayForTransitioning:(DevMenuREATransitionValues *)startValues
                                         endValues:(DevMenuREATransitionValues *)endValues
                                           forRoot:(UIView *)root
{
  if (self.propagation == DevMenuREATransitionPropagationNone) {
    return 0.;
  }

  DevMenuREATransitionValues *values = endValues;
  if (values == nil) {
    values = startValues;
  }

  double fraction = 0.;
  switch (self.propagation) {
    case DevMenuREATransitionPropagationLeft:
      fraction = values.centerRelativeToRoot.x / root.layer.bounds.size.width;
      break;
    case DevMenuREATransitionPropagationRight:
      fraction = 1. - values.centerRelativeToRoot.x / root.layer.bounds.size.width;
      break;
    case DevMenuREATransitionPropagationTop:
      fraction = values.centerRelativeToRoot.y / root.layer.bounds.size.height;
      break;
    case DevMenuREATransitionPropagationBottom:
      fraction = 1. - values.centerRelativeToRoot.y / root.layer.bounds.size.height;
      break;
  }

  return _duration * MIN(MAX(0., fraction), 1.) / DEFAULT_PROPAGATION_SPEED;
}

- (CAMediaTimingFunction *)mediaTiming
{
  switch (self.interpolation) {
    case DevMenuREATransitionInterpolationLinear:
      return [CAMediaTimingFunction functionWithName:kCAMediaTimingFunctionLinear];
    case DevMenuREATransitionInterpolationEaseIn:
      return [CAMediaTimingFunction functionWithName:kCAMediaTimingFunctionEaseIn];
    case DevMenuREATransitionInterpolationEaseOut:
      return [CAMediaTimingFunction functionWithName:kCAMediaTimingFunctionEaseOut];
    case DevMenuREATransitionInterpolationEaseInOut:
      return [CAMediaTimingFunction functionWithName:kCAMediaTimingFunctionEaseInEaseOut];
  }
}

- (DevMenuREATransitionAnimation *)animationForTransitioning:(DevMenuREATransitionValues *)startValues
                                            endValues:(DevMenuREATransitionValues *)endValues
                                              forRoot:(UIView *)root
{
  return nil;
}

- (NSArray<DevMenuREATransitionAnimation *> *)
    animationsForTransitioning:(NSMutableDictionary<NSNumber *, DevMenuREATransitionValues *> *)startValues
                     endValues:(NSMutableDictionary<NSNumber *, DevMenuREATransitionValues *> *)endValues
                       forRoot:(UIView *)root
{
  NSMutableArray *animations = [NSMutableArray new];
  [startValues enumerateKeysAndObjectsUsingBlock:^(NSNumber *key, DevMenuREATransitionValues *startValue, BOOL *stop) {
    DevMenuREATransitionValues *endValue = endValues[key];
    DevMenuREATransitionAnimation *animation = [self animationForTransitioning:startValue endValues:endValue forRoot:root];
    if (animation != nil) {
      animation.animation.timingFunction = self.mediaTiming;
      animation.animation.duration = self.duration;
      [animation delayBy:self.delay];
      CFTimeInterval propagationDelay = [self propagationDelayForTransitioning:startValue
                                                                     endValues:endValue
                                                                       forRoot:root];
      [animation delayBy:propagationDelay];
      //      animation.animation.duration -= propagationDelay;
      [animations addObject:animation];
    }
  }];
  [endValues enumerateKeysAndObjectsUsingBlock:^(NSNumber *key, DevMenuREATransitionValues *endValue, BOOL *stop) {
    if (startValues[key] == nil) {
      DevMenuREATransitionAnimation *animation = [self animationForTransitioning:nil endValues:endValue forRoot:root];
      if (animation != nil) {
        animation.animation.timingFunction = self.mediaTiming;
        animation.animation.duration = self.duration;
        [animation delayBy:self.delay];
        CFTimeInterval propagationDelay = [self propagationDelayForTransitioning:nil endValues:endValue forRoot:root];
        [animation delayBy:propagationDelay];
        //        animation.animation.duration -= propagationDelay;
        [animations addObject:animation];
      }
    }
  }];
  return animations;
}

@end
