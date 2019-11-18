/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <UIKit/UIKit.h>
#import <ABI36_0_0React/components/view/TouchEventEmitter.h>

@protocol ABI36_0_0RCTTouchableComponentViewProtocol <NSObject>
- (ABI36_0_0facebook::ABI36_0_0React::SharedTouchEventEmitter)touchEventEmitterAtPoint:(CGPoint)point;
@end
