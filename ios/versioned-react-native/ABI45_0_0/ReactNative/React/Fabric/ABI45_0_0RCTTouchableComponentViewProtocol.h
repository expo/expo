/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <UIKit/UIKit.h>
#import <ABI45_0_0React/ABI45_0_0renderer/components/view/TouchEventEmitter.h>

@protocol ABI45_0_0RCTTouchableComponentViewProtocol <NSObject>
- (ABI45_0_0facebook::ABI45_0_0React::SharedTouchEventEmitter)touchEventEmitterAtPoint:(CGPoint)point;
@end
