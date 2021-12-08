#import <QuartzCore/QuartzCore.h>
#import <React/RCTConvert.h>
#import <React/RCTViewManager.h>
#import <UIKit/UIKit.h>

#import "RCTConvert+REATransition.h"
#import "REATransition.h"
#import "REATransitionValues.h"

#define DEFAULT_PROPAGATION_SPEED 3

@interface REATransitionGroup : REATransition
@property (nonatomic) BOOL sequence;
@property (nonatomic) NSArray *transitions;
- (instancetype)initWithConfig:(NSDictionary *)config;
@end

@interface REAVisibilityTransition : REATransition
@property (nonatomic) REATransitionAnimationType animationType;
- (REATransitionAnimation *)appearView:(UIView *)view inParent:(UIView *)parent;
- (REATransitionAnimation *)disappearView:(UIView *)view fromParent:(UIView *)parent;
- (instancetype)initWithConfig:(NSDictionary *)config;
@end

@interface REAInTransition : REAVisibilityTransition
- (instancetype)initWithConfig:(NSDictionary *)config;
@end

@interface REAOutTransition : REAVisibilityTransition
- (instancetype)initWithConfig:(NSDictionary *)config;
@end

@interface REAChangeTransition : REATransition
- (instancetype)initWithConfig:(NSDictionary *)config;
@end

@implementation REATransition {
  __weak UIView *_root;
  NSMutableDictionary<NSNumber *, REATransitionValues *> *_startValues;
  NSMutableDictionary<NSNumber *, REATransitionValues *> *_endValues;
}

+ (REATransition *)inflate:(NSDictionary *)config
{
  REATransitionType type = [RCTConvert REATransitionType:config[@"type"]];
  switch (type) {
    case REATransitionTypeGroup:
      return [[REATransitionGroup alloc] initWithConfig:config];
    case REATransitionTypeIn:
      return [[REAInTransition alloc] initWithConfig:config];
    case REATransitionTypeOut:
      return [[REAOutTransition alloc] initWithConfig:config];
    case REATransitionTypeChange:
      return [[REAChangeTransition alloc] initWithConfig:config];
    case REATransitionTypeNone:
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
    _interpolation = [RCTConvert REATransitionInterpolationType:config[@"interpolation"]];
    _propagation = [RCTConvert REATransitionPropagationType:config[@"propagation"]];
  }
  return self;
}

- (void)captureRecursiveIn:(UIView *)view
                        to:(NSMutableDictionary<NSNumber *, REATransitionValues *> *)map
                   forRoot:(UIView *)root
{
  NSNumber *tag = view.reactTag;
  if (tag != nil) {
    map[tag] = [[REATransitionValues alloc] initWithView:view forRoot:root];
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
  for (REATransitionAnimation *animation in animations) {
    [animation play];
  }
  _startValues = nil;
  _endValues = nil;
}

- (REATransitionValues *)findStartValuesForKey:(NSNumber *)key
{
  if (_parent != nil) {
    return [_parent findStartValuesForKey:key];
  }
  return _startValues[key];
}

- (REATransitionValues *)findEndValuesForKey:(NSNumber *)key
{
  if (_parent != nil) {
    return [_parent findEndValuesForKey:key];
  }
  return _endValues[key];
}

- (CFTimeInterval)propagationDelayForTransitioning:(REATransitionValues *)startValues
                                         endValues:(REATransitionValues *)endValues
                                           forRoot:(UIView *)root
{
  if (self.propagation == REATransitionPropagationNone) {
    return 0.;
  }

  REATransitionValues *values = endValues;
  if (values == nil) {
    values = startValues;
  }

  double fraction = 0.;
  switch (self.propagation) {
    case REATransitionPropagationLeft:
      fraction = values.centerRelativeToRoot.x / root.layer.bounds.size.width;
      break;
    case REATransitionPropagationRight:
      fraction = 1. - values.centerRelativeToRoot.x / root.layer.bounds.size.width;
      break;
    case REATransitionPropagationTop:
      fraction = values.centerRelativeToRoot.y / root.layer.bounds.size.height;
      break;
    case REATransitionPropagationBottom:
      fraction = 1. - values.centerRelativeToRoot.y / root.layer.bounds.size.height;
      break;
  }

  return _duration * MIN(MAX(0., fraction), 1.) / DEFAULT_PROPAGATION_SPEED;
}

- (CAMediaTimingFunction *)mediaTiming
{
  switch (self.interpolation) {
    case REATransitionInterpolationLinear:
      return [CAMediaTimingFunction functionWithName:kCAMediaTimingFunctionLinear];
    case REATransitionInterpolationEaseIn:
      return [CAMediaTimingFunction functionWithName:kCAMediaTimingFunctionEaseIn];
    case REATransitionInterpolationEaseOut:
      return [CAMediaTimingFunction functionWithName:kCAMediaTimingFunctionEaseOut];
    case REATransitionInterpolationEaseInOut:
      return [CAMediaTimingFunction functionWithName:kCAMediaTimingFunctionEaseInEaseOut];
  }
}

- (REATransitionAnimation *)animationForTransitioning:(REATransitionValues *)startValues
                                            endValues:(REATransitionValues *)endValues
                                              forRoot:(UIView *)root
{
  return nil;
}

- (NSArray<REATransitionAnimation *> *)
    animationsForTransitioning:(NSMutableDictionary<NSNumber *, REATransitionValues *> *)startValues
                     endValues:(NSMutableDictionary<NSNumber *, REATransitionValues *> *)endValues
                       forRoot:(UIView *)root
{
  NSMutableArray *animations = [NSMutableArray new];
  [startValues enumerateKeysAndObjectsUsingBlock:^(NSNumber *key, REATransitionValues *startValue, BOOL *stop) {
    REATransitionValues *endValue = endValues[key];
    REATransitionAnimation *animation = [self animationForTransitioning:startValue endValues:endValue forRoot:root];
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
  [endValues enumerateKeysAndObjectsUsingBlock:^(NSNumber *key, REATransitionValues *endValue, BOOL *stop) {
    if (startValues[key] == nil) {
      REATransitionAnimation *animation = [self animationForTransitioning:nil endValues:endValue forRoot:root];
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
