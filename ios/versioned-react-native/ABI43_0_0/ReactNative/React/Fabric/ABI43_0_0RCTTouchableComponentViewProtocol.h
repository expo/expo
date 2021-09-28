/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <UIKit/UIKit.h>
#import <ABI43_0_0React/ABI43_0_0renderer/components/view/TouchEventEmitter.h>

@protocol ABI43_0_0RCTTouchableComponentViewProtocol <NSObject>
- (ABI43_0_0facebook::ABI43_0_0React::SharedTouchEventEmitter)touchEventEmitterAtPoint:(CGPoint)point;
@end
