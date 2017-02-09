/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#import "ABI14_0_0RCTViewPropertyMapper.h"

#import <UIKit/UIKit.h>

#import <ReactABI14_0_0/ABI14_0_0RCTBridge.h>
#import <ReactABI14_0_0/ABI14_0_0RCTConvert.h>
#import <ReactABI14_0_0/ABI14_0_0RCTUIManager.h>

#import "ABI14_0_0RCTNativeAnimatedModule.h"

@interface ABI14_0_0RCTViewPropertyMapper ()

@property (nonatomic, weak) UIView *cachedView;
@property (nonatomic, weak) ABI14_0_0RCTUIManager *uiManager;

@end

@implementation ABI14_0_0RCTViewPropertyMapper

- (instancetype)initWithViewTag:(NSNumber *)viewTag
                      uiManager:(ABI14_0_0RCTUIManager *)uiManager
{
  if ((self = [super init])) {
    _uiManager = uiManager;
    _viewTag = viewTag;
  }
  return self;
}

ABI14_0_0RCT_NOT_IMPLEMENTED(- (instancetype)init)

- (void)updateViewWithDictionary:(NSDictionary<NSString *, NSObject *> *)properties
{
  // cache the view for perf reasons (avoid constant lookups)
  UIView *view = _cachedView = _cachedView ?: [self.uiManager viewForReactABI14_0_0Tag:_viewTag];
  if (!view) {
    ABI14_0_0RCTLogError(@"No view to update.");
    return;
  }

  if (!properties.count) {
    return;
  }

  NSNumber *opacity = [ABI14_0_0RCTConvert NSNumber:properties[@"opacity"]];
  if (opacity) {
    view.alpha = opacity.floatValue;
  }

  NSObject *transform = properties[@"transform"];
  if ([transform isKindOfClass:[NSValue class]]) {
    view.layer.allowsEdgeAntialiasing = YES;
    view.layer.transform = ((NSValue *)transform).CATransform3DValue;
  }
}

@end
