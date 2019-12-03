#import <UIKit/UIKit.h>
#import <QuartzCore/QuartzCore.h>
#import <ReactABI34_0_0/ABI34_0_0RCTConvert.h>
#import <ReactABI34_0_0/ABI34_0_0RCTViewManager.h>

#import "ABI34_0_0REATransition.h"
#import "ABI34_0_0REATransitionValues.h"
#import "ABI34_0_0RCTConvert+REATransition.h"

#define DEFAULT_PROPAGATION_SPEED 3

@interface ABI34_0_0REATransitionGroup : ABI34_0_0REATransition
@property (nonatomic) BOOL sequence;
@property (nonatomic) NSArray *transitions;
- (instancetype)initWithConfig:(NSDictionary *)config;
@end

@interface ABI34_0_0REAVisibilityTransition : ABI34_0_0REATransition
@property (nonatomic) ABI34_0_0REATransitionAnimationType animationType;
- (ABI34_0_0REATransitionAnimation *)appearView:(UIView*)view inParent:(UIView*)parent;
- (ABI34_0_0REATransitionAnimation *)disappearView:(UIView*)view fromParent:(UIView*)parent;
- (instancetype)initWithConfig:(NSDictionary *)config;
@end

@interface ABI34_0_0REAInTransition : ABI34_0_0REAVisibilityTransition
- (instancetype)initWithConfig:(NSDictionary *)config;
@end

@interface ABI34_0_0REAOutTransition : ABI34_0_0REAVisibilityTransition
- (instancetype)initWithConfig:(NSDictionary *)config;
@end

@interface ABI34_0_0REAChangeTransition : ABI34_0_0REATransition
- (instancetype)initWithConfig:(NSDictionary *)config;
@end

@implementation ABI34_0_0REATransition {
  __weak UIView *_root;
  NSMutableDictionary<NSNumber*, ABI34_0_0REATransitionValues*> *_startValues;
  NSMutableDictionary<NSNumber*, ABI34_0_0REATransitionValues*> *_endValues;
}

+ (ABI34_0_0REATransition *)inflate:(NSDictionary *)config
{
  ABI34_0_0REATransitionType type = [ABI34_0_0RCTConvert ABI34_0_0REATransitionType:config[@"type"]];
  switch (type) {
    case ABI34_0_0REATransitionTypeGroup:
      return [[ABI34_0_0REATransitionGroup alloc] initWithConfig:config];
    case ABI34_0_0REATransitionTypeIn:
      return [[ABI34_0_0REAInTransition alloc] initWithConfig:config];
    case ABI34_0_0REATransitionTypeOut:
      return [[ABI34_0_0REAOutTransition alloc] initWithConfig:config];
    case ABI34_0_0REATransitionTypeChange:
      return [[ABI34_0_0REAChangeTransition alloc] initWithConfig:config];
    case ABI34_0_0REATransitionTypeNone:
    default:
      ABI34_0_0RCTLogError(@"Invalid transitioning type %@", config[@"type"]);
  }
  return nil;
}

- (instancetype)initWithConfig:(NSDictionary *)config
{
  if (self = [super init]) {
    _duration = [ABI34_0_0RCTConvert double:config[@"durationMs"]] / 1000.0;
    _delay = [ABI34_0_0RCTConvert double:config[@"delayMs"]] / 1000.0;
    _interpolation = [ABI34_0_0RCTConvert ABI34_0_0REATransitionInterpolationType:config[@"interpolation"]];
    _propagation = [ABI34_0_0RCTConvert ABI34_0_0REATransitionPropagationType:config[@"propagation"]];
  }
  return self;
}

- (void)captureRecursiveIn:(UIView *)view to:(NSMutableDictionary<NSNumber*, ABI34_0_0REATransitionValues*> *)map forRoot:(UIView *)root
{
  NSNumber *tag = view.ReactABI34_0_0Tag;
  if (tag != nil) {
    map[tag] = [[ABI34_0_0REATransitionValues alloc] initWithView:view forRoot:root];
    for (UIView *subview in view.ReactABI34_0_0Subviews) {
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
  NSArray *animations = [self animationsForTransitioning:_startValues
                                               endValues:_endValues
                                                 forRoot:root];
  for (ABI34_0_0REATransitionAnimation *animation in animations) {
    [animation play];
  }
  _startValues = nil;
  _endValues = nil;
}

- (ABI34_0_0REATransitionValues *)findStartValuesForKey:(NSNumber *)key
{
  if (_parent != nil) {
    return [_parent findStartValuesForKey:key];
  }
  return _startValues[key];
}

- (ABI34_0_0REATransitionValues *)findEndValuesForKey:(NSNumber *)key
{
  if (_parent != nil) {
    return [_parent findEndValuesForKey:key];
  }
  return _endValues[key];
}

- (CFTimeInterval)propagationDelayForTransitioning:(ABI34_0_0REATransitionValues *)startValues
                                         endValues:(ABI34_0_0REATransitionValues *)endValues
                                           forRoot:(UIView *)root
{
  if (self.propagation == ABI34_0_0REATransitionPropagationNone) {
    return 0.;
  }

  ABI34_0_0REATransitionValues *values = endValues;
  if (values == nil) {
    values = startValues;
  }

  double fraction = 0.;
  switch (self.propagation) {
    case ABI34_0_0REATransitionPropagationLeft:
      fraction = values.centerRelativeToRoot.x / root.layer.bounds.size.width;
      break;
    case ABI34_0_0REATransitionPropagationRight:
      fraction = 1. - values.centerRelativeToRoot.x / root.layer.bounds.size.width;
      break;
    case ABI34_0_0REATransitionPropagationTop:
      fraction = values.centerRelativeToRoot.y / root.layer.bounds.size.height;
      break;
    case ABI34_0_0REATransitionPropagationBottom:
      fraction = 1. - values.centerRelativeToRoot.y / root.layer.bounds.size.height;
      break;
  }

  return _duration * MIN(MAX(0., fraction), 1.) / DEFAULT_PROPAGATION_SPEED;
}

- (CAMediaTimingFunction *)mediaTiming
{
  switch (self.interpolation) {
    case ABI34_0_0REATransitionInterpolationLinear:
      return [CAMediaTimingFunction functionWithName:kCAMediaTimingFunctionLinear];
    case ABI34_0_0REATransitionInterpolationEaseIn:
      return [CAMediaTimingFunction functionWithName:kCAMediaTimingFunctionEaseIn];
    case ABI34_0_0REATransitionInterpolationEaseOut:
      return [CAMediaTimingFunction functionWithName:kCAMediaTimingFunctionEaseOut];
    case ABI34_0_0REATransitionInterpolationEaseInOut:
      return [CAMediaTimingFunction functionWithName:kCAMediaTimingFunctionEaseInEaseOut];
  }
}

- (ABI34_0_0REATransitionAnimation *)animationForTransitioning:(ABI34_0_0REATransitionValues *)startValues
                                               endValues:(ABI34_0_0REATransitionValues *)endValues
                                                 forRoot:(UIView *)root
{
  return nil;
}

- (NSArray<ABI34_0_0REATransitionAnimation*> *)animationsForTransitioning:(NSMutableDictionary<NSNumber *,ABI34_0_0REATransitionValues *> *)startValues
                                                          endValues:(NSMutableDictionary<NSNumber *,ABI34_0_0REATransitionValues *> *)endValues
                                                            forRoot:(UIView *)root
{
  NSMutableArray *animations = [NSMutableArray new];
  [startValues enumerateKeysAndObjectsUsingBlock:^(NSNumber *key, ABI34_0_0REATransitionValues *startValue, BOOL *stop) {
    ABI34_0_0REATransitionValues *endValue = endValues[key];
    ABI34_0_0REATransitionAnimation *animation = [self animationForTransitioning:startValue endValues:endValue forRoot:root];
    if (animation != nil) {
      animation.animation.timingFunction = self.mediaTiming;
      animation.animation.duration = self.duration;
      [animation delayBy:self.delay];
      CFTimeInterval propagationDelay = [self propagationDelayForTransitioning:startValue endValues:endValue forRoot:root];
      [animation delayBy:propagationDelay];
      //      animation.animation.duration -= propagationDelay;
      [animations addObject:animation];
    }
  }];
  [endValues enumerateKeysAndObjectsUsingBlock:^(NSNumber *key, ABI34_0_0REATransitionValues *endValue, BOOL *stop) {
    if (startValues[key] == nil) {
      ABI34_0_0REATransitionAnimation *animation = [self animationForTransitioning:nil endValues:endValue forRoot:root];
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
