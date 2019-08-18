//
//  LOTAnimatedControl.m
//  Lottie
//
//  Created by brandon_withrow on 8/25/17.
//  Copyright © 2017 Airbnb. All rights reserved.
//

#import "LOTAnimatedControl.h"
#import "LOTAnimationView_Internal.h"

@implementation LOTAnimatedControl {
  UIControlState  _priorState;
  NSMutableDictionary *_layerMap;
}

- (instancetype)initWithFrame:(CGRect)frame {
  self = [super initWithFrame:frame];
  if (self) {
    [self _commonInit];
  }
  return self;
}

- (instancetype)initWithCoder:(NSCoder *)aDecoder {
  self = [super initWithCoder:aDecoder];
  if (self) {
    [self _commonInit];
  }
  return self;
}

- (void)_commonInit {
  _animationView = [[LOTAnimationView alloc] init];
  _animationView.contentMode = UIViewContentModeScaleAspectFit;
  _animationView.userInteractionEnabled = NO;
  [self addSubview:_animationView];
  _layerMap = [NSMutableDictionary dictionary];
}

- (LOTComposition *)animationComp {
  return _animationView.sceneModel;
}

- (void)setAnimationComp:(LOTComposition *)animationComp {
  [_animationView setSceneModel:animationComp];
  [self checkStateChangedAndUpdate:YES];
}

- (void)setLayerName:(NSString * _Nonnull)layerName forState:(UIControlState)state {
  _layerMap[@(state)] = layerName;
  [self checkStateChangedAndUpdate:YES];
}

#pragma mark - Setter Overrides

- (void)setEnabled:(BOOL)enabled {
  _priorState = self.state;
  [super setEnabled:enabled];
  [self checkStateChangedAndUpdate:NO];
}

- (void)setSelected:(BOOL)selected {
  _priorState = self.state;
  [super setSelected:selected];
  [self checkStateChangedAndUpdate:NO];
}

- (void)setHighlighted:(BOOL)highlighted {
  _priorState = self.state;
  [super setHighlighted:highlighted];
  [self checkStateChangedAndUpdate:NO];
}

- (void)touchesBegan:(NSSet *)touches withEvent:(UIEvent *)event {
  _priorState = self.state;
  [super touchesBegan:touches withEvent:event];
  [self checkStateChangedAndUpdate:NO];
}

- (void)touchesMoved:(NSSet *)touches withEvent:(UIEvent *)event {
  _priorState = self.state;
  [super touchesMoved:touches withEvent:event];
  [self checkStateChangedAndUpdate:NO];
}

- (void)touchesEnded:(NSSet *)touches withEvent:(UIEvent *)event {
  _priorState = self.state;
  [super touchesEnded:touches withEvent:event];
  [self checkStateChangedAndUpdate:NO];
}

- (void)touchesCancelled:(NSSet *)touches withEvent:(UIEvent *)event {
  _priorState = self.state;
  [super touchesCancelled:touches withEvent:event];
  [self checkStateChangedAndUpdate:NO];
}

- (CGSize)intrinsicContentSize {
  return _animationView.intrinsicContentSize;
}

- (void)layoutSubviews {
  [super layoutSubviews];
  _animationView.frame = self.bounds;
}

- (UIAccessibilityTraits)accessibilityTraits {
  return UIAccessibilityTraitButton;
}

- (BOOL)isAccessibilityElement
{
  return YES;
}

#pragma mark - Private interface implementation

- (void)checkStateChangedAndUpdate:(BOOL)forceUpdate {
  if (self.state == _priorState && !forceUpdate) {
    return;
  }
  _priorState = self.state;
  
  NSString *name = _layerMap[@(self.state)];
  if (!name) {
    return;
  }
  CALayer *layer = [_animationView layerForKey:name];
  if (!layer) {
    return;
  }
  
  for (CALayer *child in [_animationView compositionLayers]) {
    child.hidden = YES;
  }
  layer.hidden = NO;
}

@end
