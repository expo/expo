/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <UIKit/UIKit.h>
#import <ABI49_0_0React/ABI49_0_0renderer/components/view/TouchEventEmitter.h>

@protocol ABI49_0_0RCTTouchableComponentViewProtocol <NSObject>
- (ABI49_0_0facebook::ABI49_0_0React::SharedTouchEventEmitter)touchEventEmitterAtPoint:(CGPoint)point;
@end
