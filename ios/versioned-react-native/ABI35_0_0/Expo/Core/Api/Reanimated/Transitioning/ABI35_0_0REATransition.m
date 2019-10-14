#import <UIKit/UIKit.h>
#import <QuartzCore/QuartzCore.h>
#import <ReactABI35_0_0/ABI35_0_0RCTConvert.h>
#import <ReactABI35_0_0/ABI35_0_0RCTViewManager.h>

#import "ABI35_0_0REATransition.h"
#import "ABI35_0_0REATransitionValues.h"
#import "ABI35_0_0RCTConvert+REATransition.h"

#define DEFAULT_PROPAGATION_SPEED 3

@interface ABI35_0_0REATransitionGroup : ABI35_0_0REATransition
@property (nonatomic) BOOL sequence;
@property (nonatomic) NSArray *transitions;
- (instancetype)initWithConfig:(NSDictionary *)config;
@end

@interface ABI35_0_0REAVisibilityTransition : ABI35_0_0REATransition
@property (nonatomic) ABI35_0_0REATransitionAnimationType animationType;
- (ABI35_0_0REATransitionAnimation *)appearView:(UIView*)view inParent:(UIView*)parent;
- (ABI35_0_0REATransitionAnimation *)disappearView:(UIView*)view fromParent:(UIView*)parent;
- (instancetype)initWithConfig:(NSDictionary *)config;
@end

@interface ABI35_0_0REAInTransition : ABI35_0_0REAVisibilityTransition
- (instancetype)initWithConfig:(NSDictionary *)config;
@end

@interface ABI35_0_0REAOutTransition : ABI35_0_0REAVisibilityTransition
- (instancetype)initWithConfig:(NSDictionary *)config;
@end

@interface ABI35_0_0REAChangeTransition : ABI35_0_0REATransition
- (instancetype)initWithConfig:(NSDictionary *)config;
@end

@implementation ABI35_0_0REATransition {
  __weak UIView *_root;
  NSMutableDictionary<NSNumber*, ABI35_0_0REATransitionValues*> *_startValues;
  NSMutableDictionary<NSNumber*, ABI35_0_0REATransitionValues*> *_endValues;
}

+ (ABI35_0_0REATransition *)inflate:(NSDictionary *)config
{
  ABI35_0_0REATransitionType type = [ABI35_0_0RCTConvert ABI35_0_0REATransitionType:config[@"type"]];
  switch (type) {
    case ABI35_0_0REATransitionTypeGroup:
      return [[ABI35_0_0REATransitionGroup alloc] initWithConfig:config];
    case ABI35_0_0REATransitionTypeIn:
      return [[ABI35_0_0REAInTransition alloc] initWithConfig:config];
    case ABI35_0_0REATransitionTypeOut:
      return [[ABI35_0_0REAOutTransition alloc] initWithConfig:config];
    case ABI35_0_0REATransitionTypeChange:
      return [[ABI35_0_0REAChangeTransition alloc] initWithConfig:config];
    case ABI35_0_0REATransitionTypeNone:
    default:
      ABI35_0_0RCTLogError(@"Invalid transitioning type %@", config[@"type"]);
  }
  return nil;
}

- (instancetype)initWithConfig:(NSDictionary *)config
{
  if (self = [super init]) {
    _duration = [ABI35_0_0RCTConvert double:config[@"durationMs"]] / 1000.0;
    _delay = [ABI35_0_0RCTConvert double:config[@"delayMs"]] / 1000.0;
    _interpolation = [ABI35_0_0RCTConvert ABI35_0_0REATransitionInterpolationType:config[@"interpolation"]];
    _propagation = [ABI35_0_0RCTConvert ABI35_0_0REATransitionPropagationType:config[@"propagation"]];
  }
  return self;
}

- (void)captureRecursiveIn:(UIView *)view to:(NSMutableDictionary<NSNumber*, ABI35_0_0REATransitionValues*> *)map forRoot:(UIView *)root
{
  NSNumber *tag = view.ReactABI35_0_0Tag;
  if (tag != nil) {
    map[tag] = [[ABI35_0_0REATransitionValues alloc] initWithView:view forRoot:root];
    for (UIView *subview in view.ReactABI35_0_0Subviews) {
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
  for (ABI35_0_0REATransitionAnimation *animation in animations) {
    [animation play];
  }
  _startValues = nil;
  _endValues = nil;
}

- (ABI35_0_0REATransitionValues *)findStartValuesForKey:(NSNumber *)key
{
  if (_parent != nil) {
    return [_parent findStartValuesForKey:key];
  }
  return _startValues[key];
}

- (ABI35_0_0REATransitionValues *)findEndValuesForKey:(NSNumber *)key
{
  if (_parent != nil) {
    return [_parent findEndValuesForKey:key];
  }
  return _endValues[key];
}

- (CFTimeInterval)propagationDelayForTransitioning:(ABI35_0_0REATransitionValues *)startValues
                                         endValues:(ABI35_0_0REATransitionValues *)endValues
                                           forRoot:(UIView *)root
{
  if (self.propagation == ABI35_0_0REATransitionPropagationNone) {
    return 0.;
  }

  ABI35_0_0REATransitionValues *values = endValues;
  if (values == nil) {
    values = startValues;
  }

  double fraction = 0.;
  switch (self.propagation) {
    case ABI35_0_0REATransitionPropagationLeft:
      fraction = values.centerRelativeToRoot.x / root.layer.bounds.size.width;
      break;
    case ABI35_0_0REATransitionPropagationRight:
      fraction = 1. - values.centerRelativeToRoot.x / root.layer.bounds.size.width;
      break;
    case ABI35_0_0REATransitionPropagationTop:
      fraction = values.centerRelativeToRoot.y / root.layer.bounds.size.height;
      break;
    case ABI35_0_0REATransitionPropagationBottom:
      fraction = 1. - values.centerRelativeToRoot.y / root.layer.bounds.size.height;
      break;
  }

  return _duration * MIN(MAX(0., fraction), 1.) / DEFAULT_PROPAGATION_SPEED;
}

- (CAMediaTimingFunction *)mediaTiming
{
  switch (self.interpolation) {
    case ABI35_0_0REATransitionInterpolationLinear:
      return [CAMediaTimingFunction functionWithName:kCAMediaTimingFunctionLinear];
    case ABI35_0_0REATransitionInterpolationEaseIn:
      return [CAMediaTimingFunction functionWithName:kCAMediaTimingFunctionEaseIn];
    case ABI35_0_0REATransitionInterpolationEaseOut:
      return [CAMediaTimingFunction functionWithName:kCAMediaTimingFunctionEaseOut];
    case ABI35_0_0REATransitionInterpolationEaseInOut:
      return [CAMediaTimingFunction functionWithName:kCAMediaTimingFunctionEaseInEaseOut];
  }
}

- (ABI35_0_0REATransitionAnimation *)animationForTransitioning:(ABI35_0_0REATransitionValues *)startValues
                                               endValues:(ABI35_0_0REATransitionValues *)endValues
                                                 forRoot:(UIView *)root
{
  return nil;
}

- (NSArray<ABI35_0_0REATransitionAnimation*> *)animationsForTransitioning:(NSMutableDictionary<NSNumber *,ABI35_0_0REATransitionValues *> *)startValues
                                                          endValues:(NSMutableDictionary<NSNumber *,ABI35_0_0REATransitionValues *> *)endValues
                                                            forRoot:(UIView *)root
{
  NSMutableArray *animations = [NSMutableArray new];
  [startValues enumerateKeysAndObjectsUsingBlock:^(NSNumber *key, ABI35_0_0REATransitionValues *startValue, BOOL *stop) {
    ABI35_0_0REATransitionValues *endValue = endValues[key];
    ABI35_0_0REATransitionAnimation *animation = [self animationForTransitioning:startValue endValues:endValue forRoot:root];
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
  [endValues enumerateKeysAndObjectsUsingBlock:^(NSNumber *key, ABI35_0_0REATransitionValues *endValue, BOOL *stop) {
    if (startValues[key] == nil) {
      ABI35_0_0REATransitionAnimation *animation = [self animationForTransitioning:nil endValues:endValue forRoot:root];
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
