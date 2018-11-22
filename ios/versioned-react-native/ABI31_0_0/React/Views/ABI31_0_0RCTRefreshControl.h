/**
 * Copyright (c) 2015-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <UIKit/UIKit.h>

#import <ReactABI31_0_0/ABI31_0_0RCTComponent.h>
#import <ReactABI31_0_0/ABI31_0_0RCTScrollableProtocol.h>

@interface ABI31_0_0RCTRefreshControl : UIRefreshControl <ABI31_0_0RCTCustomRefreshContolProtocol>

@property (nonatomic, copy) NSString *title;
@property (nonatomic, copy) ABI31_0_0RCTDirectEventBlock onRefresh;

@end
