/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <UIKit/UIKit.h>
#import <ABI39_0_0React/components/view/TouchEventEmitter.h>

@protocol ABI39_0_0RCTTouchableComponentViewProtocol <NSObject>
- (ABI39_0_0facebook::ABI39_0_0React::SharedTouchEventEmitter)touchEventEmitterAtPoint:(CGPoint)point;
@end
