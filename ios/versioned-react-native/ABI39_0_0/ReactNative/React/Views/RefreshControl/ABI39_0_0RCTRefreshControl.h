/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <UIKit/UIKit.h>

#import <ABI39_0_0React/ABI39_0_0RCTComponent.h>
#import <ABI39_0_0React/ABI39_0_0RCTScrollableProtocol.h>

@interface ABI39_0_0RCTRefreshControl : UIRefreshControl <ABI39_0_0RCTCustomRefreshContolProtocol>

@property (nonatomic, copy) NSString *title;
@property (nonatomic, copy) ABI39_0_0RCTDirectEventBlock onRefresh;

@end
