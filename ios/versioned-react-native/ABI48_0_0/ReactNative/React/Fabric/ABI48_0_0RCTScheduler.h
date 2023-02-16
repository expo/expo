/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <UIKit/UIKit.h>
#import <memory>

#import <ABI48_0_0React/ABI48_0_0renderer/componentregistry/ComponentDescriptorFactory.h>
#import <ABI48_0_0React/ABI48_0_0renderer/core/ComponentDescriptor.h>
#import <ABI48_0_0React/ABI48_0_0renderer/core/EventListener.h>
#import <ABI48_0_0React/ABI48_0_0renderer/core/LayoutConstraints.h>
#import <ABI48_0_0React/ABI48_0_0renderer/core/LayoutContext.h>
#import <ABI48_0_0React/ABI48_0_0renderer/mounting/MountingCoordinator.h>
#import <ABI48_0_0React/ABI48_0_0renderer/scheduler/SchedulerToolbox.h>
#import <ABI48_0_0React/ABI48_0_0renderer/scheduler/SurfaceHandler.h>
#import <ABI48_0_0React/ABI48_0_0renderer/uimanager/UIManager.h>
#import <ABI48_0_0React/ABI48_0_0utils/ContextContainer.h>

NS_ASSUME_NONNULL_BEGIN

@class ABI48_0_0RCTMountingManager;

/**
 * Exactly same semantic as `ABI48_0_0facebook::ABI48_0_0React::SchedulerDelegate`.
 */
@protocol ABI48_0_0RCTSchedulerDelegate

- (void)schedulerDidFinishTransaction:(ABI48_0_0facebook::ABI48_0_0React::MountingCoordinator::Shared const &)mountingCoordinator;

- (void)schedulerDidDispatchCommand:(ABI48_0_0facebook::ABI48_0_0React::ShadowView const &)shadowView
                        commandName:(std::string const &)commandName
                               args:(folly::dynamic const &)args;

- (void)schedulerDidSendAccessibilityEvent:(ABI48_0_0facebook::ABI48_0_0React::ShadowView const &)shadowView
                                 eventType:(std::string const &)eventType;

- (void)schedulerDidSetIsJSResponder:(BOOL)isJSResponder
                blockNativeResponder:(BOOL)blockNativeResponder
                       forShadowView:(ABI48_0_0facebook::ABI48_0_0React::ShadowView const &)shadowView;

@end

/**
 * `ABI48_0_0facebook::ABI48_0_0React::Scheduler` as an Objective-C class.
 */
@interface ABI48_0_0RCTScheduler : NSObject

@property (atomic, weak, nullable) id<ABI48_0_0RCTSchedulerDelegate> delegate;
@property (readonly) std::shared_ptr<ABI48_0_0facebook::ABI48_0_0React::UIManager> const uiManager;

- (instancetype)initWithToolbox:(ABI48_0_0facebook::ABI48_0_0React::SchedulerToolbox)toolbox;

- (void)registerSurface:(ABI48_0_0facebook::ABI48_0_0React::SurfaceHandler const &)surfaceHandler;
- (void)unregisterSurface:(ABI48_0_0facebook::ABI48_0_0React::SurfaceHandler const &)surfaceHandler;

- (ABI48_0_0facebook::ABI48_0_0React::ComponentDescriptor const *)findComponentDescriptorByHandle_DO_NOT_USE_THIS_IS_BROKEN:
    (ABI48_0_0facebook::ABI48_0_0React::ComponentHandle)handle;

- (void)setupAnimationDriver:(ABI48_0_0facebook::ABI48_0_0React::SurfaceHandler const &)surfaceHandler;

- (void)onAnimationStarted;

- (void)onAllAnimationsComplete;

- (void)animationTick;

- (void)addEventListener:(std::shared_ptr<ABI48_0_0facebook::ABI48_0_0React::EventListener> const &)listener;

- (void)removeEventListener:(std::shared_ptr<ABI48_0_0facebook::ABI48_0_0React::EventListener> const &)listener;

@end

NS_ASSUME_NONNULL_END
