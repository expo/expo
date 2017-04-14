/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#import <UIKit/UIKit.h>

#import <ReactABI16_0_0/ABI16_0_0RCTInvalidating.h>
#import <ReactABI16_0_0/ABI16_0_0RCTModalHostViewManager.h>
#import <ReactABI16_0_0/ABI16_0_0RCTView.h>

@class ABI16_0_0RCTBridge;
@class ABI16_0_0RCTModalHostViewController;

@protocol ABI16_0_0RCTModalHostViewInteractor;

@interface ABI16_0_0RCTModalHostView : UIView <ABI16_0_0RCTInvalidating>

@property (nonatomic, copy) NSString *animationType;
@property (nonatomic, assign, getter=isTransparent) BOOL transparent;

@property (nonatomic, copy) ABI16_0_0RCTDirectEventBlock onShow;

@property (nonatomic, weak) id<ABI16_0_0RCTModalHostViewInteractor> delegate;

@property (nonatomic, copy) NSArray<NSString *> *supportedOrientations;
@property (nonatomic, copy) ABI16_0_0RCTDirectEventBlock onOrientationChange;

- (instancetype)initWithBridge:(ABI16_0_0RCTBridge *)bridge NS_DESIGNATED_INITIALIZER;

@end

@protocol ABI16_0_0RCTModalHostViewInteractor <NSObject>

- (void)presentModalHostView:(ABI16_0_0RCTModalHostView *)modalHostView withViewController:(ABI16_0_0RCTModalHostViewController *)viewController animated:(BOOL)animated;
- (void)dismissModalHostView:(ABI16_0_0RCTModalHostView *)modalHostView withViewController:(ABI16_0_0RCTModalHostViewController *)viewController animated:(BOOL)animated;

@end
