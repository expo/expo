/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <UIKit/UIKit.h>
#import <memory>

#import <ABI36_0_0React/ABI36_0_0RCTPrimitives.h>
#import <ABI36_0_0React/core/ComponentDescriptor.h>
#import <ABI36_0_0React/core/LayoutConstraints.h>
#import <ABI36_0_0React/core/LayoutContext.h>
#import <ABI36_0_0React/mounting/MountingCoordinator.h>
#import <ABI36_0_0React/uimanager/ComponentDescriptorFactory.h>
#import <ABI36_0_0React/uimanager/SchedulerToolbox.h>
#import <ABI36_0_0React/utils/ContextContainer.h>

NS_ASSUME_NONNULL_BEGIN

@class ABI36_0_0RCTMountingManager;

/**
 * Exactly same semantic as `ABI36_0_0facebook::ABI36_0_0React::SchedulerDelegate`.
 */
@protocol ABI36_0_0RCTSchedulerDelegate

- (void)schedulerDidFinishTransaction:(ABI36_0_0facebook::ABI36_0_0React::MountingCoordinator::Shared const &)mountingCoordinator;

- (void)schedulerDidDispatchCommand:(ABI36_0_0facebook::ABI36_0_0React::ShadowView const &)shadowView
                        commandName:(std::string const &)commandName
                               args:(folly::dynamic const)args;

@end

/**
 * `ABI36_0_0facebook::ABI36_0_0React::Scheduler` as an Objective-C class.
 */
@interface ABI36_0_0RCTScheduler : NSObject

@property (atomic, weak, nullable) id<ABI36_0_0RCTSchedulerDelegate> delegate;

- (instancetype)initWithToolbox:(ABI36_0_0facebook::ABI36_0_0React::SchedulerToolbox)toolbox;

- (void)startSurfaceWithSurfaceId:(ABI36_0_0facebook::ABI36_0_0React::SurfaceId)surfaceId
                       moduleName:(NSString *)moduleName
                     initialProps:(NSDictionary *)initialProps
                layoutConstraints:(ABI36_0_0facebook::ABI36_0_0React::LayoutConstraints)layoutConstraints
                    layoutContext:(ABI36_0_0facebook::ABI36_0_0React::LayoutContext)layoutContext;

- (void)stopSurfaceWithSurfaceId:(ABI36_0_0facebook::ABI36_0_0React::SurfaceId)surfaceId;

- (CGSize)measureSurfaceWithLayoutConstraints:(ABI36_0_0facebook::ABI36_0_0React::LayoutConstraints)layoutConstraints
                                layoutContext:(ABI36_0_0facebook::ABI36_0_0React::LayoutContext)layoutContext
                                    surfaceId:(ABI36_0_0facebook::ABI36_0_0React::SurfaceId)surfaceId;

- (void)constraintSurfaceLayoutWithLayoutConstraints:(ABI36_0_0facebook::ABI36_0_0React::LayoutConstraints)layoutConstraints
                                       layoutContext:(ABI36_0_0facebook::ABI36_0_0React::LayoutContext)layoutContext
                                           surfaceId:(ABI36_0_0facebook::ABI36_0_0React::SurfaceId)surfaceId;

- (const ABI36_0_0facebook::ABI36_0_0React::ComponentDescriptor &)getComponentDescriptor:(ABI36_0_0facebook::ABI36_0_0React::ComponentHandle)handle;

@end

NS_ASSUME_NONNULL_END
