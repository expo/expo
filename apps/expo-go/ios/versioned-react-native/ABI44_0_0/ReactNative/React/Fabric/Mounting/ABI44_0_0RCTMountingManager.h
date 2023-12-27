/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <UIKit/UIKit.h>

#import <ABI44_0_0React/ABI44_0_0RCTMountingManagerDelegate.h>
#import <ABI44_0_0React/ABI44_0_0RCTPrimitives.h>
#import <ABI44_0_0React/ABI44_0_0renderer/core/ComponentDescriptor.h>
#import <ABI44_0_0React/ABI44_0_0renderer/core/ABI44_0_0ReactPrimitives.h>
#import <ABI44_0_0React/ABI44_0_0renderer/mounting/MountingCoordinator.h>
#import <ABI44_0_0React/ABI44_0_0renderer/mounting/ShadowView.h>

NS_ASSUME_NONNULL_BEGIN

@class ABI44_0_0RCTComponentViewRegistry;

/**
 * Manages mounting process.
 */
@interface ABI44_0_0RCTMountingManager : NSObject

@property (nonatomic, weak) id<ABI44_0_0RCTMountingManagerDelegate> delegate;
@property (nonatomic, strong) ABI44_0_0RCTComponentViewRegistry *componentViewRegistry;

/**
 * Schedule a mounting transaction to be performed on the main thread.
 * Can be called from any thread.
 */
- (void)scheduleTransaction:(ABI44_0_0facebook::ABI44_0_0React::MountingCoordinator::Shared const &)mountingCoordinator;

/**
 * Dispatch a command to be performed on the main thread.
 * Can be called from any thread.
 */
- (void)dispatchCommand:(ABI44_0_0ReactTag)ABI44_0_0ReactTag commandName:(NSString *)commandName args:(NSArray *)args;

- (void)synchronouslyUpdateViewOnUIThread:(ABI44_0_0ReactTag)ABI44_0_0ReactTag
                             changedProps:(NSDictionary *)props
                      componentDescriptor:(const ABI44_0_0facebook::ABI44_0_0React::ComponentDescriptor &)componentDescriptor;
@end

NS_ASSUME_NONNULL_END
