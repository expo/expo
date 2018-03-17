/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#import <UIKit/UIKit.h>

#import <ReactABI26_0_0/ABI26_0_0RCTInvalidating.h>
#import <ReactABI26_0_0/ABI26_0_0RCTModalHostViewManager.h>
#import <ReactABI26_0_0/ABI26_0_0RCTView.h>

@class ABI26_0_0RCTBridge;
@class ABI26_0_0RCTModalHostViewController;
@class ABI26_0_0RCTTVRemoteHandler;

@protocol ABI26_0_0RCTModalHostViewInteractor;

@interface ABI26_0_0RCTModalHostView : UIView <ABI26_0_0RCTInvalidating>

@property (nonatomic, copy) NSString *animationType;
@property (nonatomic, assign) UIModalPresentationStyle presentationStyle;
@property (nonatomic, assign, getter=isTransparent) BOOL transparent;

@property (nonatomic, copy) ABI26_0_0RCTDirectEventBlock onShow;

@property (nonatomic, copy) NSNumber *identifier;

@property (nonatomic, weak) id<ABI26_0_0RCTModalHostViewInteractor> delegate;

@property (nonatomic, copy) NSArray<NSString *> *supportedOrientations;
@property (nonatomic, copy) ABI26_0_0RCTDirectEventBlock onOrientationChange;

#if TARGET_OS_TV
@property (nonatomic, copy) ABI26_0_0RCTDirectEventBlock onRequestClose;
@property (nonatomic, strong) ABI26_0_0RCTTVRemoteHandler *tvRemoteHandler;
#endif

- (instancetype)initWithBridge:(ABI26_0_0RCTBridge *)bridge NS_DESIGNATED_INITIALIZER;

@end

@protocol ABI26_0_0RCTModalHostViewInteractor <NSObject>

- (void)presentModalHostView:(ABI26_0_0RCTModalHostView *)modalHostView withViewController:(ABI26_0_0RCTModalHostViewController *)viewController animated:(BOOL)animated;
- (void)dismissModalHostView:(ABI26_0_0RCTModalHostView *)modalHostView withViewController:(ABI26_0_0RCTModalHostViewController *)viewController animated:(BOOL)animated;

@end
