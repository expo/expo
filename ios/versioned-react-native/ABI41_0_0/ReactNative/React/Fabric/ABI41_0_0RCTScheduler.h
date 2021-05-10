/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <UIKit/UIKit.h>
#import <memory>

#import <ABI41_0_0React/ABI41_0_0RCTPrimitives.h>
#import <ABI41_0_0React/core/ComponentDescriptor.h>
#import <ABI41_0_0React/core/LayoutConstraints.h>
#import <ABI41_0_0React/core/LayoutContext.h>
#import <ABI41_0_0React/mounting/MountingCoordinator.h>
#import <ABI41_0_0React/uimanager/ComponentDescriptorFactory.h>
#import <ABI41_0_0React/uimanager/SchedulerToolbox.h>
#import <ABI41_0_0React/utils/ContextContainer.h>

NS_ASSUME_NONNULL_BEGIN

@class ABI41_0_0RCTMountingManager;

/**
 * Exactly same semantic as `ABI41_0_0facebook::ABI41_0_0React::SchedulerDelegate`.
 */
@protocol ABI41_0_0RCTSchedulerDelegate

- (void)schedulerDidFinishTransaction:(ABI41_0_0facebook::ABI41_0_0React::MountingCoordinator::Shared const &)mountingCoordinator;

- (void)schedulerDidDispatchCommand:(ABI41_0_0facebook::ABI41_0_0React::ShadowView const &)shadowView
                        commandName:(std::string const &)commandName
                               args:(folly::dynamic const)args;

@end

/**
 * `ABI41_0_0facebook::ABI41_0_0React::Scheduler` as an Objective-C class.
 */
@interface ABI41_0_0RCTScheduler : NSObject

@property (atomic, weak, nullable) id<ABI41_0_0RCTSchedulerDelegate> delegate;

- (instancetype)initWithToolbox:(ABI41_0_0facebook::ABI41_0_0React::SchedulerToolbox)toolbox;

- (void)startSurfaceWithSurfaceId:(ABI41_0_0facebook::ABI41_0_0React::SurfaceId)surfaceId
                       moduleName:(NSString *)moduleName
                     initialProps:(NSDictionary *)initialProps
                layoutConstraints:(ABI41_0_0facebook::ABI41_0_0React::LayoutConstraints)layoutConstraints
                    layoutContext:(ABI41_0_0facebook::ABI41_0_0React::LayoutContext)layoutContext;

- (void)stopSurfaceWithSurfaceId:(ABI41_0_0facebook::ABI41_0_0React::SurfaceId)surfaceId;

- (CGSize)measureSurfaceWithLayoutConstraints:(ABI41_0_0facebook::ABI41_0_0React::LayoutConstraints)layoutConstraints
                                layoutContext:(ABI41_0_0facebook::ABI41_0_0React::LayoutContext)layoutContext
                                    surfaceId:(ABI41_0_0facebook::ABI41_0_0React::SurfaceId)surfaceId;

- (void)constraintSurfaceLayoutWithLayoutConstraints:(ABI41_0_0facebook::ABI41_0_0React::LayoutConstraints)layoutConstraints
                                       layoutContext:(ABI41_0_0facebook::ABI41_0_0React::LayoutContext)layoutContext
                                           surfaceId:(ABI41_0_0facebook::ABI41_0_0React::SurfaceId)surfaceId;

- (ABI41_0_0facebook::ABI41_0_0React::ComponentDescriptor const *)findComponentDescriptorByHandle_DO_NOT_USE_THIS_IS_BROKEN:
    (ABI41_0_0facebook::ABI41_0_0React::ComponentHandle)handle;

- (ABI41_0_0facebook::ABI41_0_0React::MountingCoordinator::Shared)mountingCoordinatorWithSurfaceId:(ABI41_0_0facebook::ABI41_0_0React::SurfaceId)surfaceId;

@end

NS_ASSUME_NONNULL_END
