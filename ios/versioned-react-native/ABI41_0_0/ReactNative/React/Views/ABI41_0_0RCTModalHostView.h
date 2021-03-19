/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <UIKit/UIKit.h>

#import <ABI41_0_0React/ABI41_0_0RCTInvalidating.h>
#import <ABI41_0_0React/ABI41_0_0RCTModalHostViewManager.h>
#import <ABI41_0_0React/ABI41_0_0RCTView.h>

@class ABI41_0_0RCTBridge;
@class ABI41_0_0RCTModalHostViewController;
@class ABI41_0_0RCTTVRemoteHandler;

@protocol ABI41_0_0RCTModalHostViewInteractor;

@interface ABI41_0_0RCTModalHostView : UIView <ABI41_0_0RCTInvalidating>

@property (nonatomic, copy) NSString *animationType;
@property (nonatomic, assign) UIModalPresentationStyle presentationStyle;
@property (nonatomic, assign, getter=isTransparent) BOOL transparent;

@property (nonatomic, copy) ABI41_0_0RCTDirectEventBlock onShow;

@property (nonatomic, copy) NSNumber *identifier;

@property (nonatomic, weak) id<ABI41_0_0RCTModalHostViewInteractor> delegate;

@property (nonatomic, copy) NSArray<NSString *> *supportedOrientations;
@property (nonatomic, copy) ABI41_0_0RCTDirectEventBlock onOrientationChange;

#if TARGET_OS_TV
@property (nonatomic, copy) ABI41_0_0RCTDirectEventBlock onRequestClose;
@property (nonatomic, strong) ABI41_0_0RCTTVRemoteHandler *tvRemoteHandler;
#endif

- (instancetype)initWithBridge:(ABI41_0_0RCTBridge *)bridge NS_DESIGNATED_INITIALIZER;

@end

@protocol ABI41_0_0RCTModalHostViewInteractor <NSObject>

- (void)presentModalHostView:(ABI41_0_0RCTModalHostView *)modalHostView
          withViewController:(ABI41_0_0RCTModalHostViewController *)viewController
                    animated:(BOOL)animated;
- (void)dismissModalHostView:(ABI41_0_0RCTModalHostView *)modalHostView
          withViewController:(ABI41_0_0RCTModalHostViewController *)viewController
                    animated:(BOOL)animated;

@end
