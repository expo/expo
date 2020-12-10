/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#ifdef FB_SONARKIT_ENABLED

#import <UIKit/UIKit.h>
#include "FlipperStateUpdateListener.h"

@interface StateTableDataSource : NSObject<UITableViewDataSource>
@property(strong, nonatomic) NSArray<NSDictionary*>* elements;
@end

@interface FlipperDiagnosticsViewController
    : UIViewController<FlipperStateUpdateListener>
@property(strong, nonatomic) StateTableDataSource* tableDataSource;
@property(strong, nonatomic) UILabel* stateLabel;
@property(strong, nonatomic) UITableView* stateTable;
@property(strong, nonatomic) UIScrollView* scrollView;
@property(strong, nonatomic) UILabel* logLabel;

- (void)onUpdate;
@end

#endif
