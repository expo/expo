//
//  RNTapHandler.m
//  RNGestureHandler
//
//  Created by Krzysztof Magiera on 12/10/2017.
//  Copyright © 2017 Software Mansion. All rights reserved.
//

#import "RNTapHandler.h"

#import <UIKit/UIGestureRecognizerSubclass.h>

#import <React/RCTConvert.h>

// RNBetterTapGestureRecognizer extends UIGestureRecognizer instead of UITapGestureRecognizer
// because the latter does not allow for parameters like maxDelay, maxDuration, minPointers,
// maxDelta to be configured. Using our custom implementation of tap recognizer we are able
// to support these.

@interface RNBetterTapGestureRecognizer : UIGestureRecognizer

@property (nonatomic) NSUInteger numberOfTaps;
@property (nonatomic) NSTimeInterval maxDelay;
@property (nonatomic) NSTimeInterval maxDuration;
@property (nonatomic) CGFloat maxDistSq;
@property (nonatomic) CGFloat maxDeltaX;
@property (nonatomic) CGFloat maxDeltaY;
@property (nonatomic) NSInteger minPointers;

- (id)initWithGestureHandler:(RNGestureHandler *)gestureHandler;

@end

@implementation RNBetterTapGestureRecognizer {
  __weak RNGestureHandler *_gestureHandler;
  NSUInteger _tapsSoFar;
  CGPoint _initPosition;
  NSInteger _maxNumberOfTouches;
}

static const NSUInteger defaultNumberOfTaps = 1;
static const NSInteger defaultMinPointers = 1;
static const CGFloat defaultMaxDelay = 0.2;
static const NSTimeInterval defaultMaxDuration = 0.5;

- (id)initWithGestureHandler:(RNGestureHandler *)gestureHandler
{
  if ((self = [super initWithTarget:gestureHandler action:@selector(handleGesture:)])) {
    _gestureHandler = gestureHandler;
    _tapsSoFar = 0;
    _numberOfTaps = defaultNumberOfTaps;
    _minPointers = defaultMinPointers;
    _maxDelay = defaultMaxDelay;
    _maxDuration = defaultMaxDuration;
    _maxDeltaX = NAN;
    _maxDeltaY = NAN;
    _maxDistSq = NAN;
  }
  return self;
}

- (void)triggerAction
{
  [_gestureHandler handleGesture:self];
}

- (void)cancel
{
  self.enabled = NO;
}

- (void)touchesBegan:(NSSet<UITouch *> *)touches withEvent:(UIEvent *)event
{
  [super touchesBegan:touches withEvent:event];
  [_gestureHandler.pointerTracker touchesBegan:touches withEvent:event];

  if (_tapsSoFar == 0) {
    // this recognizer sends UNDETERMINED -> BEGAN state change event before gestureRecognizerShouldBegin
    // is called (it resets the gesture handler), making it send whatever the last known state as oldState
    // in the event. If we reset it here it correctly sends UNDETERMINED as oldState.
    [_gestureHandler reset];
    _initPosition = [self locationInView:self.view.window];
  }
  _tapsSoFar++;
  if (_tapsSoFar) {
    [NSObject cancelPreviousPerformRequestsWithTarget:self selector:@selector(cancel) object:nil];
  }
  NSInteger numberOfTouches = [touches count];
  if (numberOfTouches > _maxNumberOfTouches) {
    _maxNumberOfTouches = numberOfTouches;
  }
  if (!isnan(_maxDuration)) {
    [self performSelector:@selector(cancel) withObject:nil afterDelay:_maxDuration];
  }
  self.state = UIGestureRecognizerStatePossible;
  [self triggerAction];
}

- (void)touchesMoved:(NSSet<UITouch *> *)touches withEvent:(UIEvent *)event
{
  [super touchesMoved:touches withEvent:event];
  [_gestureHandler.pointerTracker touchesMoved:touches withEvent:event];

  NSInteger numberOfTouches = [touches count];
  if (numberOfTouches > _maxNumberOfTouches) {
    _maxNumberOfTouches = numberOfTouches;
  }

  if (self.state != UIGestureRecognizerStatePossible) {
    return;
  }

  if ([self shouldFailUnderCustomCriteria]) {
    self.state = UIGestureRecognizerStateFailed;
    [self triggerAction];
    [self reset];
    return;
  }

  self.state = UIGestureRecognizerStatePossible;
  [self triggerAction];
}

- (CGPoint)translationInView
{
  CGPoint currentPosition = [self locationInView:self.view.window];
  return CGPointMake(currentPosition.x - _initPosition.x, currentPosition.y - _initPosition.y);
}

- (BOOL)shouldFailUnderCustomCriteria
{
  if (_gestureHandler.shouldCancelWhenOutside) {
    if (![_gestureHandler containsPointInView]) {
      return YES;
    }
  }

  CGPoint trans = [self translationInView];
  if (TEST_MAX_IF_NOT_NAN(fabs(trans.x), _maxDeltaX)) {
    return YES;
  }
  if (TEST_MAX_IF_NOT_NAN(fabs(trans.y), _maxDeltaY)) {
    return YES;
  }
  if (TEST_MAX_IF_NOT_NAN(fabs(trans.y * trans.y + trans.x * trans.x), _maxDistSq)) {
    return YES;
  }
  return NO;
}

- (void)touchesEnded:(NSSet<UITouch *> *)touches withEvent:(UIEvent *)event
{
  [super touchesEnded:touches withEvent:event];
  [_gestureHandler.pointerTracker touchesEnded:touches withEvent:event];

  if (_numberOfTaps == _tapsSoFar && _maxNumberOfTouches >= _minPointers) {
    self.state = UIGestureRecognizerStateEnded;
    [self reset];
  } else {
    [self performSelector:@selector(cancel) withObject:nil afterDelay:_maxDelay];
  }
}

- (void)touchesCancelled:(NSSet<UITouch *> *)touches withEvent:(UIEvent *)event
{
  [super touchesCancelled:touches withEvent:event];
  [_gestureHandler.pointerTracker touchesCancelled:touches withEvent:event];

  self.state = UIGestureRecognizerStateCancelled;
  [self reset];
}

- (void)reset
{
  if (self.state == UIGestureRecognizerStateFailed) {
    [self triggerAction];
  }
  [_gestureHandler.pointerTracker reset];

  [NSObject cancelPreviousPerformRequestsWithTarget:self selector:@selector(cancel) object:nil];
  _tapsSoFar = 0;
  _maxNumberOfTouches = 0;
  self.enabled = YES;
  [super reset];
}

@end

@implementation RNTapGestureHandler {
  RNGestureHandlerEventExtraData *_lastData;
}

- (instancetype)initWithTag:(NSNumber *)tag
{
  if ((self = [super initWithTag:tag])) {
    _recognizer = [[RNBetterTapGestureRecognizer alloc] initWithGestureHandler:self];
  }
  return self;
}

- (void)resetConfig
{
  [super resetConfig];
  RNBetterTapGestureRecognizer *recognizer = (RNBetterTapGestureRecognizer *)_recognizer;

  recognizer.numberOfTaps = defaultNumberOfTaps;
  recognizer.minPointers = defaultMinPointers;
  recognizer.maxDeltaX = NAN;
  recognizer.maxDeltaY = NAN;
  recognizer.maxDelay = defaultMaxDelay;
  recognizer.maxDuration = defaultMaxDuration;
  recognizer.maxDistSq = NAN;
}

- (void)configure:(NSDictionary *)config
{
  [super configure:config];
  RNBetterTapGestureRecognizer *recognizer = (RNBetterTapGestureRecognizer *)_recognizer;

  APPLY_INT_PROP(numberOfTaps);
  APPLY_INT_PROP(minPointers);
  APPLY_FLOAT_PROP(maxDeltaX);
  APPLY_FLOAT_PROP(maxDeltaY);

  id prop = config[@"maxDelayMs"];
  if (prop != nil) {
    recognizer.maxDelay = [RCTConvert CGFloat:prop] / 1000.0;
  }

  prop = config[@"maxDurationMs"];
  if (prop != nil) {
    recognizer.maxDuration = [RCTConvert CGFloat:prop] / 1000.0;
  }

  prop = config[@"maxDist"];
  if (prop != nil) {
    CGFloat dist = [RCTConvert CGFloat:prop];
    recognizer.maxDistSq = dist * dist;
  }
}

- (RNGestureHandlerEventExtraData *)eventExtraData:(UIGestureRecognizer *)recognizer
{
  if (recognizer.state == UIGestureRecognizerStateEnded) {
    return _lastData;
  }

  _lastData = [super eventExtraData:recognizer];
  return _lastData;
}

- (BOOL)gestureRecognizerShouldBegin:(UIGestureRecognizer *)gestureRecognizer
{
  // UNDETERMINED -> BEGAN state change event is sent before this method is called,
  // in RNGestureHandler it resets _lastSatate variable, making is seem like handler
  // went from UNDETERMINED to BEGAN and then from UNDETERMINED to ACTIVE.
  // This way we preserve _lastState between events and keep correct state flow.
  RNGestureHandlerState savedState = _lastState;
  BOOL shouldBegin = [super gestureRecognizerShouldBegin:gestureRecognizer];
  _lastState = savedState;

  return shouldBegin;
}

@end
