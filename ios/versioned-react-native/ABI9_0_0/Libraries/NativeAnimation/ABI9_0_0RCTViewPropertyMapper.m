/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#import "ABI9_0_0RCTViewPropertyMapper.h"

#import <UIKit/UIKit.h>

#import "ABI9_0_0RCTBridge.h"
#import "ABI9_0_0RCTUIManager.h"
#import "ABI9_0_0RCTNativeAnimatedModule.h"

@implementation ABI9_0_0RCTViewPropertyMapper
{
  CGFloat _translateX;
  CGFloat _translateY;
  CGFloat _scaleX;
  CGFloat _scaleY;
  CGFloat _rotation;
  ABI9_0_0RCTNativeAnimatedModule *_animationModule;
}

- (instancetype)initWithViewTag:(NSNumber *)viewTag
                animationModule:(ABI9_0_0RCTNativeAnimatedModule *)animationModule
{
  if ((self = [super init])) {
    _animationModule = animationModule;
    _viewTag = viewTag;
    _translateX = 0;
    _translateY = 0;
    _scaleX = 1;
    _scaleY = 1;
    _rotation = 0;
  }
  return self;
}

ABI9_0_0RCT_NOT_IMPLEMENTED(- (instancetype)init)

- (void)updateViewWithDictionary:(NSDictionary<NSString *, NSNumber *> *)updates
{
  if (updates.count) {
    UIView *view = [_animationModule.bridge.uiManager viewForReactABI9_0_0Tag:_viewTag];
    if (!view) {
      return;
    }

    NSNumber *opacity = updates[@"opacity"];
    if (opacity) {
      view.alpha = opacity.doubleValue;
    }

    NSNumber *scale = updates[@"scale"];
    if (scale) {
      _scaleX = scale.doubleValue;
      _scaleY = scale.doubleValue;
    }
    NSNumber *scaleX = updates[@"scaleX"];
    if (scaleX) {
      _scaleX = scaleX.doubleValue;
    }
    NSNumber *scaleY = updates[@"scaleY"];
    if (scaleY) {
      _scaleY = scaleY.doubleValue;
    }
    NSNumber *translateX = updates[@"translateX"];
    if (translateX) {
      _translateX = translateX.doubleValue;
    }
    NSNumber *translateY = updates[@"translateY"];
    if (translateY) {
      _translateY = translateY.doubleValue;
    }
    NSNumber *rotation = updates[@"rotate"];
    if (rotation) {
      _rotation = rotation.doubleValue;
    }

    if (translateX || translateY || scale || scaleX || scaleY || rotation) {
      CATransform3D xform = CATransform3DMakeScale(_scaleX, _scaleY, 0);
      xform = CATransform3DTranslate(xform, _translateX, _translateY, 0);
      xform = CATransform3DRotate(xform, _rotation, 0, 0, 1);
      view.layer.allowsEdgeAntialiasing = YES;
      view.layer.transform = xform;
    }
  }
}

@end
