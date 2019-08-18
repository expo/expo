//
//  LOTAnimatedSwitch.m
//  Lottie
//
//  Created by brandon_withrow on 8/25/17.
//  Copyright © 2017 Airbnb. All rights reserved.
//

#import "LOTAnimatedSwitch.h"
#import "LOTAnimationView.h"
#import "CGGeometry+LOTAdditions.h"

@implementation LOTAnimatedSwitch {
  CGFloat _onStartProgress;
  CGFloat _onEndProgress;
  CGFloat _offStartProgress;
  CGFloat _offEndProgress;
  CGPoint _touchTrackingStart;
  BOOL _on;
  BOOL _suppressToggle;
  BOOL _toggleToState;
}

/// Convenience method to initialize a control from the Main Bundle by name
+ (instancetype _Nonnull)switchNamed:(NSString * _Nonnull)toggleName {
  return [self switchNamed:toggleName inBundle:[NSBundle mainBundle]];
}

/// Convenience method to initialize a control from the specified bundle by name
+ (instancetype _Nonnull)switchNamed:(NSString * _Nonnull)toggleName inBundle:(NSBundle * _Nonnull)bundle {
  LOTComposition *composition = [LOTComposition animationNamed:toggleName inBundle:bundle];
  LOTAnimatedSwitch *animatedControl = [[self alloc] initWithFrame:CGRectZero];
  if (composition) {
    [animatedControl setAnimationComp:composition];
    animatedControl.bounds = composition.compBounds;
  }
  return animatedControl;
}

- (instancetype)initWithFrame:(CGRect)frame {
  self = [super initWithFrame:frame];
  if (self) {
    self.accessibilityHint = NSLocalizedString(@"Double tap to toggle setting.", @"Double tap to toggle setting.");
    _onStartProgress = 0;
    _onEndProgress = 1;
    _offStartProgress = 1;
    _offEndProgress = 0;
    _on = NO;
    [self addTarget:self action:@selector(_toggle) forControlEvents:UIControlEventTouchUpInside];
  }
  return self;
}

- (void)setAnimationComp:(LOTComposition *)animationComp {
  [super setAnimationComp:animationComp];
  [self setOn:_on animated:NO];
}

#pragma mark - External Methods

- (void)setProgressRangeForOnState:(CGFloat)fromProgress toProgress:(CGFloat)toProgress {
  _onStartProgress = fromProgress;
  _onEndProgress = toProgress;
  [self setOn:_on animated:NO];
}

- (void)setProgressRangeForOffState:(CGFloat)fromProgress toProgress:(CGFloat)toProgress {
  _offStartProgress = fromProgress;
  _offEndProgress = toProgress;
  [self setOn:_on animated:NO];
}

- (void)setOn:(BOOL)on {
  [self setOn:on animated:NO];
}

- (void)setOn:(BOOL)on animated:(BOOL)animated {
  _on = on;
  
  CGFloat startProgress = on ? _onStartProgress : _offStartProgress;
  CGFloat endProgress = on ? _onEndProgress : _offEndProgress;
  CGFloat finalProgress = endProgress;
  if (self.animationView.animationProgress < MIN(startProgress, endProgress) ||
      self.animationView.animationProgress > MAX(startProgress, endProgress)) {
    if (self.animationView.animationProgress != (!_on ? _onEndProgress : _offEndProgress)) {
      // Current progress is in the wrong timeline. Switch.
      endProgress = on ? _offStartProgress : _onStartProgress;
      startProgress = on ? _offEndProgress : _onEndProgress;
    }
  }
  
  if (finalProgress == self.animationView.animationProgress) {
    return;
  }
  
  if (animated) {
    [self.animationView pause];
    [self.animationView playFromProgress:startProgress toProgress:endProgress withCompletion:^(BOOL animationFinished) {
      if (animationFinished) {
        self.animationView.animationProgress = finalProgress;
      }
    }];
  } else {
    self.animationView.animationProgress = endProgress;
  }
}

- (NSString *)accessibilityValue {
  return self.isOn ? NSLocalizedString(@"On", @"On")  : NSLocalizedString(@"Off", @"Off");
}

#pragma mark - Internal Methods

- (void)_toggle {
  if (!_suppressToggle) {
    [self _toggleAndSendActions];
  }
}

- (void)_toggleAndSendActions {
  if (self.isEnabled) {
    #ifndef TARGET_OS_TV
    if ([[[UIDevice currentDevice] systemVersion] floatValue] >= 10.0) {
      UIImpactFeedbackGenerator *generator = [[UIImpactFeedbackGenerator alloc] initWithStyle:UIImpactFeedbackStyleLight];
      [generator impactOccurred];
    }
    #endif
    [self setOn:!_on animated:YES];
    [self sendActionsForControlEvents:UIControlEventValueChanged];
  }
}

- (BOOL)beginTrackingWithTouch:(UITouch *)touch withEvent:(UIEvent *)event {
  [super beginTrackingWithTouch:touch withEvent:event];
  _suppressToggle = NO;
  _touchTrackingStart = [touch locationInView:self];
  return YES;
}

- (BOOL)continueTrackingWithTouch:(UITouch *)touch withEvent:(UIEvent *)event {
  BOOL superContinue = [super continueTrackingWithTouch:touch withEvent:event];
  if (!_interactiveGesture) {
    return superContinue;
  }
  CGPoint location = [touch locationInView:self];
  CGFloat diff = location.x - _touchTrackingStart.x;
  if (LOT_PointDistanceFromPoint(_touchTrackingStart, location) > self.bounds.size.width * 0.25) {
    // The touch has moved enough to register as its own gesture. Suppress the touch up toggle.
    _suppressToggle = YES;
  }
#ifdef __IPHONE_11_0
  // Xcode 9+
  if (@available(iOS 9.0, *)) {
#else
    // Xcode 8-
    if ([UIView respondsToSelector:@selector(userInterfaceLayoutDirectionForSemanticContentAttribute:)]) {
#endif
      if ([UIView userInterfaceLayoutDirectionForSemanticContentAttribute:self.semanticContentAttribute] == UIUserInterfaceLayoutDirectionRightToLeft) {
          diff = diff * -1;
      }
  }
  if (_on) {
    diff = diff * -1;
    if (diff <= 0) {
      self.animationView.animationProgress = _onEndProgress;
      _toggleToState = YES;
    } else {
      diff = MAX(MIN(self.bounds.size.width, diff), 0);
      self.animationView.animationProgress = LOT_RemapValue(diff, 0, self.bounds.size.width, _offStartProgress, _offEndProgress);
      _toggleToState = (diff / self.bounds.size.width) > 0.5 ? NO : YES;
    }
  } else {
    if (diff <= 0) {
      self.animationView.animationProgress = _offEndProgress;
      _toggleToState = NO;
    } else {
      diff = MAX(MIN(self.bounds.size.width, diff), 0);
      self.animationView.animationProgress = LOT_RemapValue(diff, 0, self.bounds.size.width, _onStartProgress, _onEndProgress);
      _toggleToState = (diff / self.bounds.size.width) > 0.5 ? YES : NO;
    }
  }
  return YES;
}

- (void)endTrackingWithTouch:(UITouch *)touch withEvent:(UIEvent *)event {
  [super endTrackingWithTouch:touch withEvent:event];
  if (!_interactiveGesture) {
    return;
  }
  if (_suppressToggle) {
    if (_toggleToState != _on) {
      [self _toggleAndSendActions];
    } else {
      [self setOn:_toggleToState animated:YES];
    }
  }
}

@end
