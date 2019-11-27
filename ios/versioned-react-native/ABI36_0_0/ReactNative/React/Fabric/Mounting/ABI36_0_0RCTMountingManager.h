/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <UIKit/UIKit.h>

#import <ABI36_0_0React/ABI36_0_0RCTMountingManagerDelegate.h>
#import <ABI36_0_0React/ABI36_0_0RCTPrimitives.h>
#import <ABI36_0_0React/core/ComponentDescriptor.h>
#import <ABI36_0_0React/core/ABI36_0_0ReactPrimitives.h>
#import <ABI36_0_0React/mounting/MountingCoordinator.h>
#import <ABI36_0_0React/mounting/ShadowView.h>

NS_ASSUME_NONNULL_BEGIN

@class ABI36_0_0RCTComponentViewRegistry;

/**
 * Manages mounting process.
 */
@interface ABI36_0_0RCTMountingManager : NSObject

@property (nonatomic, weak) id<ABI36_0_0RCTMountingManagerDelegate> delegate;
@property (nonatomic, strong) ABI36_0_0RCTComponentViewRegistry *componentViewRegistry;

/**
 * Schedule a mounting transaction to be performed on the main thread.
 * Can be called from any thread.
 */
- (void)scheduleTransaction:(ABI36_0_0facebook::ABI36_0_0React::MountingCoordinator::Shared const &)mountingCoordinator;

/**
 * Dispatch a command to be performed on the main thread.
 * Can be called from any thread.
 */
- (void)dispatchCommand:(ABI36_0_0ReactTag)ABI36_0_0ReactTag commandName:(NSString *)commandName args:(NSArray *)args;

- (void)synchronouslyUpdateViewOnUIThread:(ABI36_0_0ReactTag)ABI36_0_0ReactTag
                             changedProps:(NSDictionary *)props
                      componentDescriptor:(const ABI36_0_0facebook::ABI36_0_0React::ComponentDescriptor &)componentDescriptor;
@end

NS_ASSUME_NONNULL_END
