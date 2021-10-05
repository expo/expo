/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <UIKit/UIKit.h>
#import <memory>

#import <ABI43_0_0React/ABI43_0_0renderer/componentregistry/ComponentDescriptorFactory.h>
#import <ABI43_0_0React/ABI43_0_0renderer/core/ComponentDescriptor.h>
#import <ABI43_0_0React/ABI43_0_0renderer/core/LayoutConstraints.h>
#import <ABI43_0_0React/ABI43_0_0renderer/core/LayoutContext.h>
#import <ABI43_0_0React/ABI43_0_0renderer/mounting/MountingCoordinator.h>
#import <ABI43_0_0React/ABI43_0_0renderer/scheduler/SchedulerToolbox.h>
#import <ABI43_0_0React/ABI43_0_0utils/ContextContainer.h>

NS_ASSUME_NONNULL_BEGIN

@class ABI43_0_0RCTMountingManager;

/**
 * Exactly same semantic as `ABI43_0_0facebook::ABI43_0_0React::SchedulerDelegate`.
 */
@protocol ABI43_0_0RCTSchedulerDelegate

- (void)schedulerDidFinishTransaction:(ABI43_0_0facebook::ABI43_0_0React::MountingCoordinator::Shared const &)mountingCoordinator;

- (void)schedulerDidDispatchCommand:(ABI43_0_0facebook::ABI43_0_0React::ShadowView const &)shadowView
                        commandName:(std::string const &)commandName
                               args:(folly::dynamic const)args;

@end

/**
 * `ABI43_0_0facebook::ABI43_0_0React::Scheduler` as an Objective-C class.
 */
@interface ABI43_0_0RCTScheduler : NSObject

@property (atomic, weak, nullable) id<ABI43_0_0RCTSchedulerDelegate> delegate;

- (instancetype)initWithToolbox:(ABI43_0_0facebook::ABI43_0_0React::SchedulerToolbox)toolbox;

- (void)startSurfaceWithSurfaceId:(ABI43_0_0facebook::ABI43_0_0React::SurfaceId)surfaceId
                       moduleName:(NSString *)moduleName
                     initialProps:(NSDictionary *)initialProps
                layoutConstraints:(ABI43_0_0facebook::ABI43_0_0React::LayoutConstraints)layoutConstraints
                    layoutContext:(ABI43_0_0facebook::ABI43_0_0React::LayoutContext)layoutContext;

- (void)stopSurfaceWithSurfaceId:(ABI43_0_0facebook::ABI43_0_0React::SurfaceId)surfaceId;

- (CGSize)measureSurfaceWithLayoutConstraints:(ABI43_0_0facebook::ABI43_0_0React::LayoutConstraints)layoutConstraints
                                layoutContext:(ABI43_0_0facebook::ABI43_0_0React::LayoutContext)layoutContext
                                    surfaceId:(ABI43_0_0facebook::ABI43_0_0React::SurfaceId)surfaceId;

- (void)constraintSurfaceLayoutWithLayoutConstraints:(ABI43_0_0facebook::ABI43_0_0React::LayoutConstraints)layoutConstraints
                                       layoutContext:(ABI43_0_0facebook::ABI43_0_0React::LayoutContext)layoutContext
                                           surfaceId:(ABI43_0_0facebook::ABI43_0_0React::SurfaceId)surfaceId;

- (ABI43_0_0facebook::ABI43_0_0React::ComponentDescriptor const *)findComponentDescriptorByHandle_DO_NOT_USE_THIS_IS_BROKEN:
    (ABI43_0_0facebook::ABI43_0_0React::ComponentHandle)handle;

- (ABI43_0_0facebook::ABI43_0_0React::MountingCoordinator::Shared)mountingCoordinatorWithSurfaceId:(ABI43_0_0facebook::ABI43_0_0React::SurfaceId)surfaceId;

- (void)onAnimationStarted;

- (void)onAllAnimationsComplete;

- (void)animationTick;

@end

NS_ASSUME_NONNULL_END
