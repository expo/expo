/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <UIKit/UIKit.h>

@protocol ABI48_0_0RCTFabricModalHostViewControllerDelegate <NSObject>
- (void)boundsDidChange:(CGRect)newBounds;
@end

@interface ABI48_0_0RCTFabricModalHostViewController : UIViewController

@property (nonatomic, weak) id<ABI48_0_0RCTFabricModalHostViewControllerDelegate> delegate;

@property (nonatomic, assign) UIInterfaceOrientationMask supportedInterfaceOrientations;

@end
