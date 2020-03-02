/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <UIKit/UIKit.h>
#import <memory>

#import <ABI37_0_0React/ABI37_0_0RCTPrimitives.h>
#import <ABI37_0_0React/core/ComponentDescriptor.h>
#import <ABI37_0_0React/core/LayoutConstraints.h>
#import <ABI37_0_0React/core/LayoutContext.h>
#import <ABI37_0_0React/mounting/MountingCoordinator.h>
#import <ABI37_0_0React/uimanager/ComponentDescriptorFactory.h>
#import <ABI37_0_0React/uimanager/SchedulerToolbox.h>
#import <ABI37_0_0React/utils/ContextContainer.h>

NS_ASSUME_NONNULL_BEGIN

@class ABI37_0_0RCTMountingManager;

/**
 * Exactly same semantic as `ABI37_0_0facebook::ABI37_0_0React::SchedulerDelegate`.
 */
@protocol ABI37_0_0RCTSchedulerDelegate

- (void)schedulerDidFinishTransaction:(ABI37_0_0facebook::ABI37_0_0React::MountingCoordinator::Shared const &)mountingCoordinator;

- (void)schedulerDidDispatchCommand:(ABI37_0_0facebook::ABI37_0_0React::ShadowView const &)shadowView
                        commandName:(std::string const &)commandName
                               args:(folly::dynamic const)args;

@end

/**
 * `ABI37_0_0facebook::ABI37_0_0React::Scheduler` as an Objective-C class.
 */
@interface ABI37_0_0RCTScheduler : NSObject

@property (atomic, weak, nullable) id<ABI37_0_0RCTSchedulerDelegate> delegate;

- (instancetype)initWithToolbox:(ABI37_0_0facebook::ABI37_0_0React::SchedulerToolbox)toolbox;

- (void)startSurfaceWithSurfaceId:(ABI37_0_0facebook::ABI37_0_0React::SurfaceId)surfaceId
                       moduleName:(NSString *)moduleName
                     initialProps:(NSDictionary *)initialProps
                layoutConstraints:(ABI37_0_0facebook::ABI37_0_0React::LayoutConstraints)layoutConstraints
                    layoutContext:(ABI37_0_0facebook::ABI37_0_0React::LayoutContext)layoutContext;

- (void)stopSurfaceWithSurfaceId:(ABI37_0_0facebook::ABI37_0_0React::SurfaceId)surfaceId;

- (CGSize)measureSurfaceWithLayoutConstraints:(ABI37_0_0facebook::ABI37_0_0React::LayoutConstraints)layoutConstraints
                                layoutContext:(ABI37_0_0facebook::ABI37_0_0React::LayoutContext)layoutContext
                                    surfaceId:(ABI37_0_0facebook::ABI37_0_0React::SurfaceId)surfaceId;

- (void)constraintSurfaceLayoutWithLayoutConstraints:(ABI37_0_0facebook::ABI37_0_0React::LayoutConstraints)layoutConstraints
                                       layoutContext:(ABI37_0_0facebook::ABI37_0_0React::LayoutContext)layoutContext
                                           surfaceId:(ABI37_0_0facebook::ABI37_0_0React::SurfaceId)surfaceId;

- (const ABI37_0_0facebook::ABI37_0_0React::ComponentDescriptor &)getComponentDescriptor:(ABI37_0_0facebook::ABI37_0_0React::ComponentHandle)handle;

@end

NS_ASSUME_NONNULL_END
