//
//  RNPanHandler.m
//  RNGestureHandler
//
//  Created by Krzysztof Magiera on 12/10/2017.
//  Copyright © 2017 Software Mansion. All rights reserved.
//

#import "RNPanHandler.h"

#import <UIKit/UIGestureRecognizerSubclass.h>

@interface RNBetterPanGestureRecognizer : UIPanGestureRecognizer

@property (nonatomic) CGFloat minDistSq;
@property (nonatomic) CGFloat minVelocityX;
@property (nonatomic) CGFloat minVelocityY;
@property (nonatomic) CGFloat minVelocitySq;
@property (nonatomic) CGFloat activeOffsetXStart;
@property (nonatomic) CGFloat activeOffsetXEnd;
@property (nonatomic) CGFloat failOffsetXStart;
@property (nonatomic) CGFloat failOffsetXEnd;
@property (nonatomic) CGFloat activeOffsetYStart;
@property (nonatomic) CGFloat activeOffsetYEnd;
@property (nonatomic) CGFloat failOffsetYStart;
@property (nonatomic) CGFloat failOffsetYEnd;
@property (nonatomic) CGFloat activateAfterLongPress;


- (id)initWithGestureHandler:(RNGestureHandler*)gestureHandler;

@end


@implementation RNBetterPanGestureRecognizer {
  __weak RNGestureHandler *_gestureHandler;
  NSUInteger _realMinimumNumberOfTouches;
  BOOL _hasCustomActivationCriteria;
}

- (id)initWithGestureHandler:(RNGestureHandler*)gestureHandler
{
  if ((self = [super initWithTarget:gestureHandler action:@selector(handleGesture:)])) {
    _gestureHandler = gestureHandler;
    _minDistSq = NAN;
    _minVelocityX = NAN;
    _minVelocityY = NAN;
    _minVelocitySq = NAN;
    _activeOffsetXStart = NAN;
    _activeOffsetXEnd = NAN;
    _failOffsetXStart = NAN;
    _failOffsetXEnd = NAN;
    _activeOffsetYStart = NAN;
    _activeOffsetYEnd = NAN;
    _failOffsetYStart = NAN;
    _failOffsetYEnd = NAN;
    _activateAfterLongPress = NAN;
    _hasCustomActivationCriteria = NO;
#if !TARGET_OS_TV
    _realMinimumNumberOfTouches = self.minimumNumberOfTouches;
#endif
  }
  return self;
}

- (void)triggerAction
{
  [_gestureHandler handleGesture:self];
}

- (void)setMinimumNumberOfTouches:(NSUInteger)minimumNumberOfTouches
{
  _realMinimumNumberOfTouches = minimumNumberOfTouches;
}

- (void)activateAfterLongPress
{
  self.state = UIGestureRecognizerStateBegan;
  // Send event in ACTIVE state because UIGestureRecognizerStateBegan is mapped to RNGestureHandlerStateBegan
  [_gestureHandler handleGesture:self inState:RNGestureHandlerStateActive];
}

- (void)touchesBegan:(NSSet<UITouch *> *)touches withEvent:(UIEvent *)event
{
  if ([self numberOfTouches] == 0) {
    [_gestureHandler reset];
  }
#if !TARGET_OS_TV
  if (_hasCustomActivationCriteria) {
    // We use "minimumNumberOfTouches" property to prevent pan handler from recognizing
    // the gesture too early before we are sure that all criteria (e.g. minimum distance
    // etc. are met)
    super.minimumNumberOfTouches = 20;
  } else {
    super.minimumNumberOfTouches = _realMinimumNumberOfTouches;
  }
#endif
  [super touchesBegan:touches withEvent:event];
  [self triggerAction];
  [_gestureHandler.pointerTracker touchesBegan:touches withEvent:event];
    
  if (!isnan(_activateAfterLongPress)) {
    [self performSelector:@selector(activateAfterLongPress) withObject:nil afterDelay:_activateAfterLongPress];
  }
}

- (void)touchesMoved:(NSSet<UITouch *> *)touches withEvent:(UIEvent *)event
{
  [super touchesMoved:touches withEvent:event];
  [_gestureHandler.pointerTracker touchesMoved:touches withEvent:event];
  
  if (self.state == UIGestureRecognizerStatePossible && [self shouldFailUnderCustomCriteria]) {
    self.state = UIGestureRecognizerStateFailed;
    return;
  }
  if ((self.state == UIGestureRecognizerStatePossible || self.state == UIGestureRecognizerStateChanged)) {
    if (_gestureHandler.shouldCancelWhenOutside && ![_gestureHandler containsPointInView]) {
      // If the previous recognizer state is UIGestureRecognizerStateChanged
      // then UIGestureRecognizer's sate machine will only transition to
      // UIGestureRecognizerStateCancelled even if you set the state to
      // UIGestureRecognizerStateFailed here. Making the behavior explicit.
      self.state = (self.state == UIGestureRecognizerStatePossible)
      ? UIGestureRecognizerStateFailed
      : UIGestureRecognizerStateCancelled;
      [self reset];
      return;
    }
  }
  if (_hasCustomActivationCriteria && self.state == UIGestureRecognizerStatePossible && [self shouldActivateUnderCustomCriteria]) {
#if !TARGET_OS_TV
    super.minimumNumberOfTouches = _realMinimumNumberOfTouches;
    if ([self numberOfTouches] >= _realMinimumNumberOfTouches) {
      self.state = UIGestureRecognizerStateBegan;
      [self setTranslation:CGPointMake(0, 0) inView:self.view];
    }
#endif
  }
}

- (void)touchesEnded:(NSSet<UITouch *> *)touches withEvent:(UIEvent *)event
{
  [super touchesEnded:touches withEvent:event];
  [_gestureHandler.pointerTracker touchesEnded:touches withEvent:event];
}

- (void)touchesCancelled:(NSSet<UITouch *> *)touches withEvent:(UIEvent *)event
{
  [super touchesCancelled:touches withEvent:event];
  [_gestureHandler.pointerTracker touchesCancelled:touches withEvent:event];
}

- (void)reset
{
  [self triggerAction];
  [_gestureHandler.pointerTracker reset];
  [NSObject cancelPreviousPerformRequestsWithTarget:self selector:@selector(activateAfterLongPress) object:nil];
  self.enabled = YES;
  [super reset];
}

- (void)updateHasCustomActivationCriteria
{
  _hasCustomActivationCriteria = !isnan(_minDistSq)
  || !isnan(_minVelocityX) || !isnan(_minVelocityY) || !isnan(_minVelocitySq)
  || !isnan(_activeOffsetXStart) || !isnan(_activeOffsetXEnd)
  ||  !isnan(_activeOffsetYStart) || !isnan(_activeOffsetYEnd);
}

- (BOOL)shouldFailUnderCustomCriteria
{
  CGPoint trans = [self translationInView:self.view.window];
  // Apple docs say that 10 units is the default allowable movement for UILongPressGestureRecognizer
  if (!isnan(_activateAfterLongPress) && trans.x * trans.x + trans.y * trans.y > 100) {
    [NSObject cancelPreviousPerformRequestsWithTarget:self selector:@selector(activateAfterLongPress) object:nil];
    return YES;
  }
    
  if (!isnan(_failOffsetXStart) && trans.x < _failOffsetXStart) {
    return YES;
  }
  if (!isnan(_failOffsetXEnd) && trans.x > _failOffsetXEnd) {
    return YES;
  }
  if (!isnan(_failOffsetYStart) && trans.y < _failOffsetYStart) {
    return YES;
  }
  if (!isnan(_failOffsetYEnd) && trans.y > _failOffsetYEnd) {
    return YES;
  }
  return NO;
}

- (BOOL)shouldActivateUnderCustomCriteria
{
  CGPoint trans = [self translationInView:self.view.window];
  if (!isnan(_activeOffsetXStart) && trans.x < _activeOffsetXStart) {
    return YES;
  }
  if (!isnan(_activeOffsetXEnd) && trans.x > _activeOffsetXEnd) {
    return YES;
  }
  if (!isnan(_activeOffsetYStart) && trans.y < _activeOffsetYStart) {
    return YES;
  }
  if (!isnan(_activeOffsetYEnd) && trans.y > _activeOffsetYEnd) {
    return YES;
  }
  
  if (TEST_MIN_IF_NOT_NAN(VEC_LEN_SQ(trans), _minDistSq)) {
    return YES;
  }
  
  CGPoint velocity = [self velocityInView:self.view];
  if (TEST_MIN_IF_NOT_NAN(velocity.x, _minVelocityX)) {
    return YES;
  }
  if (TEST_MIN_IF_NOT_NAN(velocity.y, _minVelocityY)) {
    return YES;
  }
  if (TEST_MIN_IF_NOT_NAN(VEC_LEN_SQ(velocity), _minVelocitySq)) {
    return YES;
  }
  
  return NO;
}

@end

@implementation RNPanGestureHandler

- (instancetype)initWithTag:(NSNumber *)tag
{
  if ((self = [super initWithTag:tag])) {
    _recognizer = [[RNBetterPanGestureRecognizer alloc] initWithGestureHandler:self];
  }
  return self;
}

- (void)resetConfig
{
  [super resetConfig];
  RNBetterPanGestureRecognizer *recognizer = (RNBetterPanGestureRecognizer *)_recognizer;
  recognizer.minVelocityX = NAN;
  recognizer.minVelocityY = NAN;
  recognizer.activeOffsetXStart = NAN;
  recognizer.activeOffsetXEnd = NAN;
  recognizer.failOffsetXStart = NAN;
  recognizer.failOffsetXEnd = NAN;
  recognizer.activeOffsetYStart = NAN;
  recognizer.activeOffsetYEnd = NAN;
  recognizer.failOffsetYStart = NAN;
  recognizer.failOffsetYStart = NAN;
  recognizer.failOffsetYEnd = NAN;
#if !TARGET_OS_TV && __IPHONE_OS_VERSION_MAX_ALLOWED >= 130400
  if (@available(iOS 13.4, *)) {
    recognizer.allowedScrollTypesMask = 0;
  }
#endif
#if !TARGET_OS_TV
  recognizer.minimumNumberOfTouches = 1;
  recognizer.maximumNumberOfTouches = NSUIntegerMax;
#endif
  recognizer.minDistSq = NAN;
  recognizer.minVelocitySq = NAN;
  recognizer.activateAfterLongPress = NAN;
}

- (void)configure:(NSDictionary *)config
{
  [super configure:config];
  RNBetterPanGestureRecognizer *recognizer = (RNBetterPanGestureRecognizer *)_recognizer;
  
  APPLY_FLOAT_PROP(minVelocityX);
  APPLY_FLOAT_PROP(minVelocityY);
  APPLY_FLOAT_PROP(activeOffsetXStart);
  APPLY_FLOAT_PROP(activeOffsetXEnd);
  APPLY_FLOAT_PROP(failOffsetXStart);
  APPLY_FLOAT_PROP(failOffsetXEnd);
  APPLY_FLOAT_PROP(activeOffsetYStart);
  APPLY_FLOAT_PROP(activeOffsetYEnd);
  APPLY_FLOAT_PROP(failOffsetYStart);
  APPLY_FLOAT_PROP(failOffsetYEnd);

#if !TARGET_OS_TV && __IPHONE_OS_VERSION_MAX_ALLOWED >= 130400
  if (@available(iOS 13.4, *)) {
    bool enableTrackpadTwoFingerGesture = [RCTConvert BOOL:config[@"enableTrackpadTwoFingerGesture"]];
    if(enableTrackpadTwoFingerGesture){
      recognizer.allowedScrollTypesMask = UIScrollTypeMaskAll;
    }
  }

  APPLY_NAMED_INT_PROP(minimumNumberOfTouches, @"minPointers");
  APPLY_NAMED_INT_PROP(maximumNumberOfTouches, @"maxPointers");
#endif
    
  id prop = config[@"minDist"];
  if (prop != nil) {
    CGFloat dist = [RCTConvert CGFloat:prop];
    recognizer.minDistSq = dist * dist;
  }
  
  prop = config[@"minVelocity"];
  if (prop != nil) {
    CGFloat velocity = [RCTConvert CGFloat:prop];
    recognizer.minVelocitySq = velocity * velocity;
  }
    
  prop = config[@"activateAfterLongPress"];
  if (prop != nil) {
    recognizer.activateAfterLongPress = [RCTConvert CGFloat:prop] / 1000.0;
    recognizer.minDistSq = MAX(100, recognizer.minDistSq);
  }
  [recognizer updateHasCustomActivationCriteria];
}

- (BOOL) gestureRecognizerShouldBegin:(UIGestureRecognizer *)gestureRecognizer
{
  RNGestureHandlerState savedState = _lastState;
  BOOL shouldBegin = [super gestureRecognizerShouldBegin:gestureRecognizer];
  _lastState = savedState;
  
  return shouldBegin;
}

- (RNGestureHandlerEventExtraData *)eventExtraData:(UIPanGestureRecognizer *)recognizer
{
  return [RNGestureHandlerEventExtraData
          forPan:[recognizer locationInView:recognizer.view]
          withAbsolutePosition:[recognizer locationInView:recognizer.view.window]
          withTranslation:[recognizer translationInView:recognizer.view.window]
          withVelocity:[recognizer velocityInView:recognizer.view.window]
          withNumberOfTouches:recognizer.numberOfTouches];
}

@end
