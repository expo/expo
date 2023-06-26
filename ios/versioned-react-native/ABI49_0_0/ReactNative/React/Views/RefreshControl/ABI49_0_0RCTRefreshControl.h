/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <UIKit/UIKit.h>

#import <ABI49_0_0React/ABI49_0_0RCTComponent.h>
#import <ABI49_0_0React/ABI49_0_0RCTScrollableProtocol.h>

@interface ABI49_0_0RCTRefreshControl : UIRefreshControl <ABI49_0_0RCTCustomRefreshControlProtocol>

@property (nonatomic, copy) NSString *title;
@property (nonatomic, copy) ABI49_0_0RCTDirectEventBlock onRefresh;
@property (nonatomic, weak) UIScrollView *scrollView;

@end
