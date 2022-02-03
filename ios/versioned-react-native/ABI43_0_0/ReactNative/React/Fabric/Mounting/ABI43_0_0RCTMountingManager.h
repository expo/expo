/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <UIKit/UIKit.h>

#import <ABI43_0_0React/ABI43_0_0RCTMountingManagerDelegate.h>
#import <ABI43_0_0React/ABI43_0_0RCTPrimitives.h>
#import <ABI43_0_0React/ABI43_0_0renderer/core/ComponentDescriptor.h>
#import <ABI43_0_0React/ABI43_0_0renderer/core/ABI43_0_0ReactPrimitives.h>
#import <ABI43_0_0React/ABI43_0_0renderer/mounting/MountingCoordinator.h>
#import <ABI43_0_0React/ABI43_0_0renderer/mounting/ShadowView.h>

NS_ASSUME_NONNULL_BEGIN

@class ABI43_0_0RCTComponentViewRegistry;

/**
 * Manages mounting process.
 */
@interface ABI43_0_0RCTMountingManager : NSObject

@property (nonatomic, weak) id<ABI43_0_0RCTMountingManagerDelegate> delegate;
@property (nonatomic, strong) ABI43_0_0RCTComponentViewRegistry *componentViewRegistry;

/**
 * Schedule a mounting transaction to be performed on the main thread.
 * Can be called from any thread.
 */
- (void)scheduleTransaction:(ABI43_0_0facebook::ABI43_0_0React::MountingCoordinator::Shared const &)mountingCoordinator;

/**
 * Dispatch a command to be performed on the main thread.
 * Can be called from any thread.
 */
- (void)dispatchCommand:(ABI43_0_0ReactTag)ABI43_0_0ReactTag commandName:(NSString *)commandName args:(NSArray *)args;

- (void)synchronouslyUpdateViewOnUIThread:(ABI43_0_0ReactTag)ABI43_0_0ReactTag
                             changedProps:(NSDictionary *)props
                      componentDescriptor:(const ABI43_0_0facebook::ABI43_0_0React::ComponentDescriptor &)componentDescriptor;
@end

NS_ASSUME_NONNULL_END
