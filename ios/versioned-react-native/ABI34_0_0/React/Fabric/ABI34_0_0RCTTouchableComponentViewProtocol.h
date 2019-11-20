/**
 * Copyright (c) 2015-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <UIKit/UIKit.h>
#import <ReactABI34_0_0/components/view/TouchEventEmitter.h>

@protocol ABI34_0_0RCTTouchableComponentViewProtocol <NSObject>
- (facebook::ReactABI34_0_0::SharedTouchEventEmitter)touchEventEmitterAtPoint:(CGPoint)point;
@end
