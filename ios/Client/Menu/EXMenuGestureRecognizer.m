#import "EXMenuGestureRecognizer.h"
#import "EXKernel.h"
#import "EXKernelDevKeyCommands.h"

#import <UIKit/UIGestureRecognizerSubclass.h>
#import <React/RCTUtils.h>

const CGFloat kEXForceTouchSwitchThreshold = 0.995;
const CGFloat kEXForceTouchCaptureThreshold = 0.85;

@interface EXMenuGestureRecognizer () <UIGestureRecognizerDelegate>

@property (nonatomic, strong) NSMutableSet<UITouch *> *touches;
@property (nonatomic, assign) BOOL usesForceTouch;

@property (nonatomic, strong) NSDate *dtmLongPressBegan;
@property (nonatomic, strong) NSTimer *tmrLongPress;

@end

@implementation EXMenuGestureRecognizer

- (instancetype)initWithTarget:(id)target action:(SEL)action
{
  if ((self = [super initWithTarget:target action:action])) {
    _usesForceTouch = RCTForceTouchAvailable();
    self.cancelsTouchesInView = NO;
    self.delaysTouchesBegan = NO;
    self.delaysTouchesEnded = NO;
    
    self.delegate = self;
  }
  
  return self;
}

+ (BOOL)isLegacyMenuGestureAvailable
{
  BOOL isSimulator = NO;
#if TARGET_OS_SIMULATOR
  isSimulator = YES;
#endif
  return (
    !isSimulator
    && [EXKernelDevKeyCommands sharedInstance].isLegacyMenuBehaviorEnabled
    && [EXKernel sharedInstance].appRegistry.appEnumerator.allObjects.count > 0
  );
}

+ (NSTimeInterval)longPressDuration
{
  return 0.4f;
}

#pragma mark - UIGestureRecognizer lifecycle

- (void)touchesBegan:(NSSet<UITouch *> *)touches withEvent:(UIEvent *)event
{
  [super touchesBegan:touches withEvent:event];
  
  [self _addTouches:touches];
  [self _updateStateWithActiveTouches];
}

- (void)touchesMoved:(NSSet<UITouch *> *)touches withEvent:(UIEvent *)event
{
  [super touchesMoved:touches withEvent:event];
  [self _updateStateWithActiveTouches];
}

- (void)touchesEnded:(NSSet<UITouch *> *)touches withEvent:(UIEvent *)event
{
  [super touchesEnded:touches withEvent:event];
  [self _removeTouches:touches];
  [self _updateStateWithActiveTouches];
}

- (void)touchesCancelled:(NSSet<UITouch *> *)touches withEvent:(UIEvent *)event
{
  [super touchesCancelled:touches withEvent:event];
  [self _removeTouches:touches];
  [self _updateStateWithActiveTouches];
}

- (BOOL)canPreventGestureRecognizer:(__unused UIGestureRecognizer *)preventedGestureRecognizer
{
  return NO;
}

- (BOOL)canBePreventedByGestureRecognizer:(UIGestureRecognizer *)preventingGestureRecognizer
{
  return ![preventingGestureRecognizer.view isDescendantOfView:self.view];
}

#pragma mark - UIGestureRecognizerDelegate

- (BOOL)gestureRecognizer:(__unused UIGestureRecognizer *)gestureRecognizer
shouldRequireFailureOfGestureRecognizer:(UIGestureRecognizer *)otherGestureRecognizer
{
  return [self canBePreventedByGestureRecognizer:otherGestureRecognizer];
}

#pragma mark - analyzing the current gesture

- (void)_updateStateWithActiveTouches
{
  [self _triageTouches];
  UIGestureRecognizerState finalState = UIGestureRecognizerStateCancelled;
  if ([[self class] isLegacyMenuGestureAvailable]) {
    if (_usesForceTouch) {
      finalState = [self _stateFromActiveTouchesUsingForceTouch];
    } else {
      finalState = [self _stateFromActiveTouchesUsingLongPress];
    }
  }
  self.state = finalState;
}

- (UIGestureRecognizerState)_stateFromActiveTouchesUsingForceTouch
{
  UIGestureRecognizerState finalState = UIGestureRecognizerStatePossible;
  CGFloat avgForce = [self _forceFromTouches];
  if (_touches.count == 2 && avgForce > kEXForceTouchCaptureThreshold) {
    if (self.state == UIGestureRecognizerStatePossible || self.state == UIGestureRecognizerStateCancelled) {
      finalState = UIGestureRecognizerStateBegan;
    } else {
      finalState = UIGestureRecognizerStateChanged;
    }
    // if force exceeds higher threshold, complete gesture
    if (avgForce > kEXForceTouchSwitchThreshold) {
      finalState = UIGestureRecognizerStateEnded;
    }
  } else {
    // not 2 touches, or not within force threshold
    if (self.state != UIGestureRecognizerStatePossible) {
      finalState = UIGestureRecognizerStateCancelled;
    }
  }
  return finalState;
}

- (UIGestureRecognizerState)_stateFromActiveTouchesUsingLongPress
{
  UIGestureRecognizerState finalState = UIGestureRecognizerStatePossible;
  if (_touches.count == 2) {
    NSDate *now = [NSDate date];
    if (self.state == UIGestureRecognizerStatePossible || self.state == UIGestureRecognizerStateCancelled) {
      finalState = UIGestureRecognizerStateBegan;
      _dtmLongPressBegan = now;
      _tmrLongPress = [NSTimer scheduledTimerWithTimeInterval:[[self class] longPressDuration]
                                                       target:self
                                                     selector:@selector(_updateStateWithActiveTouches)
                                                     userInfo:nil
                                                      repeats:NO];
    } else {
      finalState = UIGestureRecognizerStateChanged;
    }
    // if long press lasts long enough, complete gesture
    if ([now timeIntervalSinceDate:_dtmLongPressBegan] > [[self class] longPressDuration]) {
      finalState = UIGestureRecognizerStateEnded;
      [self _invalidateLongPress];
    }
  } else {
    // not 2 touches
    if (self.state != UIGestureRecognizerStatePossible) {
      finalState = UIGestureRecognizerStateCancelled;
    }
    [self _invalidateLongPress];
  }
  return finalState;
}

#pragma mark - internal utility

- (void)_addTouches:(NSSet<UITouch *> *)touches
{
  if (!_touches) {
    _touches = [NSMutableSet set];
  }
  for (UITouch *touch in touches) {
    [_touches addObject:touch];
  }
}

- (void)_removeTouches:(NSSet<UITouch *> *)touches
{
  for (UITouch *touch in touches) {
    [_touches removeObject:touch];
  }
}

- (void)_triageTouches
{
  // remove any others that have ended
  NSMutableArray<UITouch *> *touchesToRemove = [NSMutableArray array];
  for (UITouch *touch in _touches) {
    if (touch.phase == UITouchPhaseEnded || touch.phase == UITouchPhaseCancelled) {
      [touchesToRemove addObject:touch];
    }
  }
  for (UITouch *touch in touchesToRemove) {
    [_touches removeObject:touch];
  }
  if ([[self class] allTouchesAreCancelledOrEnded:_touches]) {
    self.state = UIGestureRecognizerStateCancelled;
  }
}

- (CGFloat)_forceFromTouches
{
  if (_usesForceTouch) {
    CGFloat forceSum = 0;
    for (UITouch *touch in _touches) {
      forceSum += RCTZeroIfNaN(touch.force / touch.maximumPossibleForce);
    }
    return forceSum / (CGFloat)_touches.count;
  }
  return 0;
}

- (void)_invalidateLongPress
{
  _dtmLongPressBegan = nil;
  if (_tmrLongPress) {
    [_tmrLongPress invalidate];
    _tmrLongPress = nil;
  }
}

+ (BOOL)allTouchesAreCancelledOrEnded:(NSSet<UITouch *> *)touches
{
  for (UITouch *touch in touches) {
    if (touch.phase == UITouchPhaseBegan ||
        touch.phase == UITouchPhaseMoved ||
        touch.phase == UITouchPhaseStationary) {
      return NO;
    }
  }
  return YES;
}

+ (BOOL)anyTouchesChanged:(NSSet<UITouch *> *)touches
{
  for (UITouch *touch in touches) {
    if (touch.phase == UITouchPhaseBegan ||
        touch.phase == UITouchPhaseMoved) {
      return YES;
    }
  }
  return NO;
}

@end
