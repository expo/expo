/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#import "ABI10_0_0RCTViewPropertyMapper.h"

#import <UIKit/UIKit.h>

#import "ABI10_0_0RCTBridge.h"
#import "ABI10_0_0RCTConvert.h"
#import "ABI10_0_0RCTUIManager.h"
#import "ABI10_0_0RCTNativeAnimatedModule.h"

@implementation ABI10_0_0RCTViewPropertyMapper
{
  ABI10_0_0RCTNativeAnimatedModule *_animationModule;
}

- (instancetype)initWithViewTag:(NSNumber *)viewTag
                animationModule:(ABI10_0_0RCTNativeAnimatedModule *)animationModule
{
  if ((self = [super init])) {
    _animationModule = animationModule;
    _viewTag = viewTag;
    _animationModule = animationModule;
  }
  return self;
}

ABI10_0_0RCT_NOT_IMPLEMENTED(- (instancetype)init)

- (void)updateViewWithDictionary:(NSDictionary<NSString *, NSObject *> *)updates
{
  if (!updates.count) {
    return;
  }

  UIView *view = [_animationModule.bridge.uiManager viewForReactABI10_0_0Tag:_viewTag];
  if (!view) {
    return;
  }

  NSNumber *opacity = [ABI10_0_0RCTConvert NSNumber:updates[@"opacity"]];
  if (opacity) {
    view.alpha = opacity.floatValue;
  }

  NSObject *transform = updates[@"transform"];
  if ([transform isKindOfClass:[NSValue class]]) {
    view.layer.allowsEdgeAntialiasing = YES;
    view.layer.transform = ((NSValue *)transform).CATransform3DValue;
  }
}

@end
