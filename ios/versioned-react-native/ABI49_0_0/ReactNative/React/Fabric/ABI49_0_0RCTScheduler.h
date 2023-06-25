/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <UIKit/UIKit.h>
#import <memory>

#import <ABI49_0_0React/renderer/componentregistry/ABI49_0_0ComponentDescriptorFactory.h>
#import <ABI49_0_0React/renderer/core/ABI49_0_0ComponentDescriptor.h>
#import <ABI49_0_0React/renderer/core/ABI49_0_0EventListener.h>
#import <ABI49_0_0React/renderer/core/ABI49_0_0LayoutConstraints.h>
#import <ABI49_0_0React/renderer/core/ABI49_0_0LayoutContext.h>
#import <ABI49_0_0React/renderer/mounting/ABI49_0_0MountingCoordinator.h>
#import <ABI49_0_0React/renderer/scheduler/ABI49_0_0SchedulerToolbox.h>
#import <ABI49_0_0React/renderer/scheduler/ABI49_0_0SurfaceHandler.h>
#import <ABI49_0_0React/renderer/uimanager/ABI49_0_0UIManager.h>
#import <ABI49_0_0React/utils/ABI49_0_0ContextContainer.h>

NS_ASSUME_NONNULL_BEGIN

@class ABI49_0_0RCTMountingManager;

/**
 * Exactly same semantic as `ABI49_0_0facebook::ABI49_0_0React::SchedulerDelegate`.
 */
@protocol ABI49_0_0RCTSchedulerDelegate

- (void)schedulerDidFinishTransaction:(ABI49_0_0facebook::ABI49_0_0React::MountingCoordinator::Shared)mountingCoordinator;

- (void)schedulerDidDispatchCommand:(ABI49_0_0facebook::ABI49_0_0React::ShadowView const &)shadowView
                        commandName:(std::string const &)commandName
                               args:(folly::dynamic const &)args;

- (void)schedulerDidSendAccessibilityEvent:(ABI49_0_0facebook::ABI49_0_0React::ShadowView const &)shadowView
                                 eventType:(std::string const &)eventType;

- (void)schedulerDidSetIsJSResponder:(BOOL)isJSResponder
                blockNativeResponder:(BOOL)blockNativeResponder
                       forShadowView:(ABI49_0_0facebook::ABI49_0_0React::ShadowView const &)shadowView;

@end

/**
 * `ABI49_0_0facebook::ABI49_0_0React::Scheduler` as an Objective-C class.
 */
@interface ABI49_0_0RCTScheduler : NSObject

@property (atomic, weak, nullable) id<ABI49_0_0RCTSchedulerDelegate> delegate;
@property (readonly) std::shared_ptr<ABI49_0_0facebook::ABI49_0_0React::UIManager> const uiManager;

- (instancetype)initWithToolbox:(ABI49_0_0facebook::ABI49_0_0React::SchedulerToolbox)toolbox;

- (void)registerSurface:(ABI49_0_0facebook::ABI49_0_0React::SurfaceHandler const &)surfaceHandler;
- (void)unregisterSurface:(ABI49_0_0facebook::ABI49_0_0React::SurfaceHandler const &)surfaceHandler;

- (ABI49_0_0facebook::ABI49_0_0React::ComponentDescriptor const *)findComponentDescriptorByHandle_DO_NOT_USE_THIS_IS_BROKEN:
    (ABI49_0_0facebook::ABI49_0_0React::ComponentHandle)handle;

- (void)setupAnimationDriver:(ABI49_0_0facebook::ABI49_0_0React::SurfaceHandler const &)surfaceHandler;

- (void)onAnimationStarted;

- (void)onAllAnimationsComplete;

- (void)animationTick;

- (void)addEventListener:(std::shared_ptr<ABI49_0_0facebook::ABI49_0_0React::EventListener> const &)listener;

- (void)removeEventListener:(std::shared_ptr<ABI49_0_0facebook::ABI49_0_0React::EventListener> const &)listener;

@end

NS_ASSUME_NONNULL_END
