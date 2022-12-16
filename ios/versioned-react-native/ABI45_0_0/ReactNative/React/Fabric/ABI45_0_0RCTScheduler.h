/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <UIKit/UIKit.h>
#import <memory>

#import <ABI45_0_0React/ABI45_0_0renderer/componentregistry/ComponentDescriptorFactory.h>
#import <ABI45_0_0React/ABI45_0_0renderer/core/ComponentDescriptor.h>
#import <ABI45_0_0React/ABI45_0_0renderer/core/LayoutConstraints.h>
#import <ABI45_0_0React/ABI45_0_0renderer/core/LayoutContext.h>
#import <ABI45_0_0React/ABI45_0_0renderer/mounting/MountingCoordinator.h>
#import <ABI45_0_0React/ABI45_0_0renderer/scheduler/SchedulerToolbox.h>
#import <ABI45_0_0React/ABI45_0_0renderer/scheduler/SurfaceHandler.h>
#import <ABI45_0_0React/ABI45_0_0utils/ContextContainer.h>

NS_ASSUME_NONNULL_BEGIN

@class ABI45_0_0RCTMountingManager;

/**
 * Exactly same semantic as `ABI45_0_0facebook::ABI45_0_0React::SchedulerDelegate`.
 */
@protocol ABI45_0_0RCTSchedulerDelegate

- (void)schedulerDidFinishTransaction:(ABI45_0_0facebook::ABI45_0_0React::MountingCoordinator::Shared const &)mountingCoordinator;

- (void)schedulerDidDispatchCommand:(ABI45_0_0facebook::ABI45_0_0React::ShadowView const &)shadowView
                        commandName:(std::string const &)commandName
                               args:(folly::dynamic const &)args;

- (void)schedulerDidSendAccessibilityEvent:(ABI45_0_0facebook::ABI45_0_0React::ShadowView const &)shadowView
                                 eventType:(std::string const &)eventType;

- (void)schedulerDidSetIsJSResponder:(BOOL)isJSResponder
                blockNativeResponder:(BOOL)blockNativeResponder
                       forShadowView:(ABI45_0_0facebook::ABI45_0_0React::ShadowView const &)shadowView;

@end

/**
 * `ABI45_0_0facebook::ABI45_0_0React::Scheduler` as an Objective-C class.
 */
@interface ABI45_0_0RCTScheduler : NSObject

@property (atomic, weak, nullable) id<ABI45_0_0RCTSchedulerDelegate> delegate;

- (instancetype)initWithToolbox:(ABI45_0_0facebook::ABI45_0_0React::SchedulerToolbox)toolbox;

- (void)registerSurface:(ABI45_0_0facebook::ABI45_0_0React::SurfaceHandler const &)surfaceHandler;
- (void)unregisterSurface:(ABI45_0_0facebook::ABI45_0_0React::SurfaceHandler const &)surfaceHandler;

- (ABI45_0_0facebook::ABI45_0_0React::ComponentDescriptor const *)findComponentDescriptorByHandle_DO_NOT_USE_THIS_IS_BROKEN:
    (ABI45_0_0facebook::ABI45_0_0React::ComponentHandle)handle;

- (void)setupAnimationDriver:(ABI45_0_0facebook::ABI45_0_0React::SurfaceHandler const &)surfaceHandler;

- (void)onAnimationStarted;

- (void)onAllAnimationsComplete;

- (void)animationTick;

@end

NS_ASSUME_NONNULL_END
