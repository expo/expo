/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <UIKit/UIKit.h>

NS_ASSUME_NONNULL_BEGIN

@protocol ABI49_0_0RCTImageResponseDelegate <NSObject>

- (void)didReceiveImage:(UIImage *)image metadata:(id)metadata fromObserver:(void const *)observer;
- (void)didReceiveProgress:(float)progress fromObserver:(void const *)observer;
- (void)didReceiveFailureFromObserver:(void const *)observer;

@end

NS_ASSUME_NONNULL_END
