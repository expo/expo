/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <UIKit/UIKit.h>

#import <ABI43_0_0React/ABI43_0_0RCTInvalidating.h>
#import <ABI43_0_0React/ABI43_0_0RCTModalHostViewManager.h>
#import <ABI43_0_0React/ABI43_0_0RCTView.h>

@class ABI43_0_0RCTBridge;
@class ABI43_0_0RCTModalHostViewController;

@protocol ABI43_0_0RCTModalHostViewInteractor;

@interface ABI43_0_0RCTModalHostView : UIView <ABI43_0_0RCTInvalidating>

@property (nonatomic, copy) NSString *animationType;
@property (nonatomic, assign) UIModalPresentationStyle presentationStyle;
@property (nonatomic, assign, getter=isTransparent) BOOL transparent;

@property (nonatomic, copy) ABI43_0_0RCTDirectEventBlock onShow;

@property (nonatomic, copy) NSNumber *identifier;

@property (nonatomic, weak) id<ABI43_0_0RCTModalHostViewInteractor> delegate;

@property (nonatomic, copy) NSArray<NSString *> *supportedOrientations;
@property (nonatomic, copy) ABI43_0_0RCTDirectEventBlock onOrientationChange;

- (instancetype)initWithBridge:(ABI43_0_0RCTBridge *)bridge NS_DESIGNATED_INITIALIZER;

@end

@protocol ABI43_0_0RCTModalHostViewInteractor <NSObject>

- (void)presentModalHostView:(ABI43_0_0RCTModalHostView *)modalHostView
          withViewController:(ABI43_0_0RCTModalHostViewController *)viewController
                    animated:(BOOL)animated;
- (void)dismissModalHostView:(ABI43_0_0RCTModalHostView *)modalHostView
          withViewController:(ABI43_0_0RCTModalHostViewController *)viewController
                    animated:(BOOL)animated;

@end
