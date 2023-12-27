/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <UIKit/UIKit.h>
#import <memory>

#import <ABI42_0_0React/ABI42_0_0RCTPrimitives.h>
#import <ABI42_0_0React/core/ComponentDescriptor.h>
#import <ABI42_0_0React/core/LayoutConstraints.h>
#import <ABI42_0_0React/core/LayoutContext.h>
#import <ABI42_0_0React/mounting/MountingCoordinator.h>
#import <ABI42_0_0React/uimanager/ComponentDescriptorFactory.h>
#import <ABI42_0_0React/uimanager/SchedulerToolbox.h>
#import <ABI42_0_0React/utils/ContextContainer.h>

NS_ASSUME_NONNULL_BEGIN

@class ABI42_0_0RCTMountingManager;

/**
 * Exactly same semantic as `ABI42_0_0facebook::ABI42_0_0React::SchedulerDelegate`.
 */
@protocol ABI42_0_0RCTSchedulerDelegate

- (void)schedulerDidFinishTransaction:(ABI42_0_0facebook::ABI42_0_0React::MountingCoordinator::Shared const &)mountingCoordinator;

- (void)schedulerDidDispatchCommand:(ABI42_0_0facebook::ABI42_0_0React::ShadowView const &)shadowView
                        commandName:(std::string const &)commandName
                               args:(folly::dynamic const)args;

@end

/**
 * `ABI42_0_0facebook::ABI42_0_0React::Scheduler` as an Objective-C class.
 */
@interface ABI42_0_0RCTScheduler : NSObject

@property (atomic, weak, nullable) id<ABI42_0_0RCTSchedulerDelegate> delegate;

- (instancetype)initWithToolbox:(ABI42_0_0facebook::ABI42_0_0React::SchedulerToolbox)toolbox;

- (void)startSurfaceWithSurfaceId:(ABI42_0_0facebook::ABI42_0_0React::SurfaceId)surfaceId
                       moduleName:(NSString *)moduleName
                     initialProps:(NSDictionary *)initialProps
                layoutConstraints:(ABI42_0_0facebook::ABI42_0_0React::LayoutConstraints)layoutConstraints
                    layoutContext:(ABI42_0_0facebook::ABI42_0_0React::LayoutContext)layoutContext;

- (void)stopSurfaceWithSurfaceId:(ABI42_0_0facebook::ABI42_0_0React::SurfaceId)surfaceId;

- (CGSize)measureSurfaceWithLayoutConstraints:(ABI42_0_0facebook::ABI42_0_0React::LayoutConstraints)layoutConstraints
                                layoutContext:(ABI42_0_0facebook::ABI42_0_0React::LayoutContext)layoutContext
                                    surfaceId:(ABI42_0_0facebook::ABI42_0_0React::SurfaceId)surfaceId;

- (void)constraintSurfaceLayoutWithLayoutConstraints:(ABI42_0_0facebook::ABI42_0_0React::LayoutConstraints)layoutConstraints
                                       layoutContext:(ABI42_0_0facebook::ABI42_0_0React::LayoutContext)layoutContext
                                           surfaceId:(ABI42_0_0facebook::ABI42_0_0React::SurfaceId)surfaceId;

- (ABI42_0_0facebook::ABI42_0_0React::ComponentDescriptor const *)findComponentDescriptorByHandle_DO_NOT_USE_THIS_IS_BROKEN:
    (ABI42_0_0facebook::ABI42_0_0React::ComponentHandle)handle;

- (ABI42_0_0facebook::ABI42_0_0React::MountingCoordinator::Shared)mountingCoordinatorWithSurfaceId:(ABI42_0_0facebook::ABI42_0_0React::SurfaceId)surfaceId;

@end

NS_ASSUME_NONNULL_END
