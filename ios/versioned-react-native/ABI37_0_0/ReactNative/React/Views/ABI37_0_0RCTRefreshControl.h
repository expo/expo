/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <UIKit/UIKit.h>

#import <ABI37_0_0React/ABI37_0_0RCTComponent.h>
#import <ABI37_0_0React/ABI37_0_0RCTScrollableProtocol.h>

@interface ABI37_0_0RCTRefreshControl : UIRefreshControl <ABI37_0_0RCTCustomRefreshContolProtocol>

@property (nonatomic, copy) NSString *title;
@property (nonatomic, copy) ABI37_0_0RCTDirectEventBlock onRefresh;

@end
