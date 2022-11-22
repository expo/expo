/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <UIKit/UIKit.h>
#import <memory>

#import <ABI47_0_0React/ABI47_0_0renderer/componentregistry/ComponentDescriptorFactory.h>
#import <ABI47_0_0React/ABI47_0_0renderer/core/ComponentDescriptor.h>
#import <ABI47_0_0React/ABI47_0_0renderer/core/EventListener.h>
#import <ABI47_0_0React/ABI47_0_0renderer/core/LayoutConstraints.h>
#import <ABI47_0_0React/ABI47_0_0renderer/core/LayoutContext.h>
#import <ABI47_0_0React/ABI47_0_0renderer/mounting/MountingCoordinator.h>
#import <ABI47_0_0React/ABI47_0_0renderer/scheduler/SchedulerToolbox.h>
#import <ABI47_0_0React/ABI47_0_0renderer/scheduler/SurfaceHandler.h>
#import <ABI47_0_0React/ABI47_0_0renderer/uimanager/UIManager.h>
#import <ABI47_0_0React/ABI47_0_0utils/ContextContainer.h>

NS_ASSUME_NONNULL_BEGIN

@class ABI47_0_0RCTMountingManager;

/**
 * Exactly same semantic as `ABI47_0_0facebook::ABI47_0_0React::SchedulerDelegate`.
 */
@protocol ABI47_0_0RCTSchedulerDelegate

- (void)schedulerDidFinishTransaction:(ABI47_0_0facebook::ABI47_0_0React::MountingCoordinator::Shared const &)mountingCoordinator;

- (void)schedulerDidDispatchCommand:(ABI47_0_0facebook::ABI47_0_0React::ShadowView const &)shadowView
                        commandName:(std::string const &)commandName
                               args:(folly::dynamic const &)args;

- (void)schedulerDidSendAccessibilityEvent:(ABI47_0_0facebook::ABI47_0_0React::ShadowView const &)shadowView
                                 eventType:(std::string const &)eventType;

- (void)schedulerDidSetIsJSResponder:(BOOL)isJSResponder
                blockNativeResponder:(BOOL)blockNativeResponder
                       forShadowView:(ABI47_0_0facebook::ABI47_0_0React::ShadowView const &)shadowView;

@end

/**
 * `ABI47_0_0facebook::ABI47_0_0React::Scheduler` as an Objective-C class.
 */
@interface ABI47_0_0RCTScheduler : NSObject

@property (atomic, weak, nullable) id<ABI47_0_0RCTSchedulerDelegate> delegate;
@property (readonly) std::shared_ptr<ABI47_0_0facebook::ABI47_0_0React::UIManager> const uiManager;

- (instancetype)initWithToolbox:(ABI47_0_0facebook::ABI47_0_0React::SchedulerToolbox)toolbox;

- (void)registerSurface:(ABI47_0_0facebook::ABI47_0_0React::SurfaceHandler const &)surfaceHandler;
- (void)unregisterSurface:(ABI47_0_0facebook::ABI47_0_0React::SurfaceHandler const &)surfaceHandler;

- (ABI47_0_0facebook::ABI47_0_0React::ComponentDescriptor const *)findComponentDescriptorByHandle_DO_NOT_USE_THIS_IS_BROKEN:
    (ABI47_0_0facebook::ABI47_0_0React::ComponentHandle)handle;

- (void)setupAnimationDriver:(ABI47_0_0facebook::ABI47_0_0React::SurfaceHandler const &)surfaceHandler;

- (void)onAnimationStarted;

- (void)onAllAnimationsComplete;

- (void)animationTick;

- (void)addEventListener:(std::shared_ptr<ABI47_0_0facebook::ABI47_0_0React::EventListener> const &)listener;

- (void)removeEventListener:(std::shared_ptr<ABI47_0_0facebook::ABI47_0_0React::EventListener> const &)listener;

@end

NS_ASSUME_NONNULL_END
