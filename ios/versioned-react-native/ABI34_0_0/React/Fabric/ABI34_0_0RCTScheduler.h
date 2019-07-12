/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <UIKit/UIKit.h>
#import <memory>

#import <ReactABI34_0_0/ABI34_0_0RCTPrimitives.h>
#import <ReactABI34_0_0/core/LayoutConstraints.h>
#import <ReactABI34_0_0/core/LayoutContext.h>
#import <ReactABI34_0_0/mounting/ShadowViewMutation.h>

NS_ASSUME_NONNULL_BEGIN

@class ABI34_0_0RCTMountingManager;

/**
 * Exactly same semantic as `facebook::ReactABI34_0_0::SchedulerDelegate`.
 */
@protocol ABI34_0_0RCTSchedulerDelegate

- (void)schedulerDidFinishTransaction:(facebook::ReactABI34_0_0::ShadowViewMutationList)mutations
                              rootTag:(ReactABI34_0_0Tag)rootTag;

- (void)schedulerOptimisticallyCreateComponentViewWithComponentHandle:(facebook::ReactABI34_0_0::ComponentHandle)componentHandle;

@end

/**
 * `facebook::ReactABI34_0_0::Scheduler` as an Objective-C class.
 */
@interface ABI34_0_0RCTScheduler : NSObject

@property (atomic, weak, nullable) id<ABI34_0_0RCTSchedulerDelegate> delegate;

- (instancetype)initWithContextContainer:(std::shared_ptr<void>)contextContatiner;

- (void)startSurfaceWithSurfaceId:(facebook::ReactABI34_0_0::SurfaceId)surfaceId
                       moduleName:(NSString *)moduleName
                     initailProps:(NSDictionary *)initialProps
                layoutConstraints:(facebook::ReactABI34_0_0::LayoutConstraints)layoutConstraints
                    layoutContext:(facebook::ReactABI34_0_0::LayoutContext)layoutContext;

- (void)stopSurfaceWithSurfaceId:(facebook::ReactABI34_0_0::SurfaceId)surfaceId;

- (CGSize)measureSurfaceWithLayoutConstraints:(facebook::ReactABI34_0_0::LayoutConstraints)layoutConstraints
                                layoutContext:(facebook::ReactABI34_0_0::LayoutContext)layoutContext
                                    surfaceId:(facebook::ReactABI34_0_0::SurfaceId)surfaceId;

- (void)constraintSurfaceLayoutWithLayoutConstraints:(facebook::ReactABI34_0_0::LayoutConstraints)layoutConstraints
                                       layoutContext:(facebook::ReactABI34_0_0::LayoutContext)layoutContext
                                           surfaceId:(facebook::ReactABI34_0_0::SurfaceId)surfaceId;

@end

NS_ASSUME_NONNULL_END
