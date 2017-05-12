//
//  ABI17_0_0EXContainerView.m
//  LottieReactABI17_0_0Native
//
//  Created by Leland Richardson on 12/12/16.
//  Copyright © 2016 Airbnb. All rights reserved.
//

#import "ABI17_0_0EXContainerView.h"

// import UIView+ReactABI17_0_0.h
#if __has_include(<ReactABI17_0_0/UIView+ReactABI17_0_0.h>)
#import <ReactABI17_0_0/UIView+ReactABI17_0_0.h>
#elif __has_include("UIView+ReactABI17_0_0.h")
#import "UIView+ReactABI17_0_0.h"
#else
#import "ReactABI17_0_0/UIView+ReactABI17_0_0.h"
#endif

@implementation ABI17_0_0EXContainerView {
  LOTAnimationView *_animationView;
}

- (void)ReactABI17_0_0SetFrame:(CGRect)frame
{
  [super ReactABI17_0_0SetFrame:frame];
  if (_animationView != nil) {
    [_animationView ReactABI17_0_0SetFrame:frame];
  }
}

- (void)setProgress:(CGFloat)progress {
  _progress = progress;
  if (_animationView != nil) {
    _animationView.animationProgress = _progress;
  }
}

- (void)setSpeed:(CGFloat)speed {
  _speed = speed;
  if (_animationView != nil) {
    _animationView.animationSpeed = _speed;
  }
}

- (void)setLoop:(BOOL)loop {
  _loop = loop;
  if (_animationView != nil) {
    _animationView.loopAnimation = _loop;
  }
}

- (void)setSourceJson:(NSDictionary *)json {
  [self replaceAnimationView:[LOTAnimationView animationFromJSON:json]];
}

- (void)setSourceName:(NSString *)name {
  [self replaceAnimationView:[LOTAnimationView animationNamed:name]];
}

- (void)play {
  if (_animationView != nil) {
    [_animationView play];
  }
}

- (void)reset {
  if (_animationView != nil) {
    _animationView.animationProgress = 0;
    [_animationView pause];
  }
}

# pragma mark Private

- (void)replaceAnimationView:(LOTAnimationView *)next {
  if (_animationView != nil) {
    [_animationView removeFromSuperview];
  }
  _animationView = next;
  [self addSubview: next];
  [_animationView ReactABI17_0_0SetFrame:self.frame];
  [self applyProperties];
}

- (void)applyProperties {
  _animationView.animationProgress = _progress;
  _animationView.animationSpeed = _speed;
  _animationView.loopAnimation = _loop;
}

@end
