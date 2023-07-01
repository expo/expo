/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <UIKit/UIKit.h>

#import <ABI49_0_0React/ABI49_0_0RCTPrimitives.h>
#import <ABI49_0_0React/ABI49_0_0RCTSurfacePresenterStub.h>
#import <ABI49_0_0React/ABI49_0_0RCTSurfaceStage.h>
#import <ABI49_0_0ReactCommon/ABI49_0_0RuntimeExecutor.h>
#import <ABI49_0_0React/renderer/scheduler/ABI49_0_0SurfaceHandler.h>
#import <ABI49_0_0React/utils/ABI49_0_0ContextContainer.h>

NS_ASSUME_NONNULL_BEGIN

@class ABI49_0_0RCTFabricSurface;
@class ABI49_0_0RCTImageLoader;
@class ABI49_0_0RCTMountingManager;
@class ABI49_0_0RCTScheduler;

/**
 * Coordinates presenting of ABI49_0_0React Native Surfaces and represents application
 * facing interface of running ABI49_0_0React Native core.
 */
@interface ABI49_0_0RCTSurfacePresenter : NSObject

- (instancetype)initWithContextContainer:(ABI49_0_0facebook::ABI49_0_0React::ContextContainer::Shared)contextContainer
                         runtimeExecutor:(ABI49_0_0facebook::ABI49_0_0React::RuntimeExecutor)runtimeExecutor
              bridgelessBindingsExecutor:(std::optional<ABI49_0_0facebook::ABI49_0_0React::RuntimeExecutor>)bridgelessBindingsExecutor;

@property (nonatomic) ABI49_0_0facebook::ABI49_0_0React::ContextContainer::Shared contextContainer;
@property (nonatomic) ABI49_0_0facebook::ABI49_0_0React::RuntimeExecutor runtimeExecutor;

/*
 * Suspends/resumes all surfaces associated with the presenter.
 * Suspending is a process or graceful stopping all surfaces and destroying all underlying infrastructure
 * with a future possibility of recreating the infrastructure and restarting the surfaces from scratch.
 * Suspending is usually a part of a bundle reloading process.
 * Can be called on any thread.
 */
- (BOOL)suspend;
- (BOOL)resume;

@end

@interface ABI49_0_0RCTSurfacePresenter (Surface) <ABI49_0_0RCTSurfacePresenterStub>

/*
 * Surface uses these methods to register itself in the Presenter.
 */
- (void)registerSurface:(ABI49_0_0RCTFabricSurface *)surface;
- (void)unregisterSurface:(ABI49_0_0RCTFabricSurface *)surface;

@property (readonly) ABI49_0_0RCTMountingManager *mountingManager;
@property (readonly, nullable) ABI49_0_0RCTScheduler *scheduler;

/*
 * Allow callers to initialize a new fabric surface without adding Fabric as a Buck dependency.
 */
- (id<ABI49_0_0RCTSurfaceProtocol>)createFabricSurfaceForModuleName:(NSString *)moduleName
                                         initialProperties:(NSDictionary *)initialProperties;

- (nullable ABI49_0_0RCTFabricSurface *)surfaceForRootTag:(ABI49_0_0ReactTag)rootTag;

- (BOOL)synchronouslyUpdateViewOnUIThread:(NSNumber *)ABI49_0_0ReactTag props:(NSDictionary *)props;

- (void)setupAnimationDriverWithSurfaceHandler:(ABI49_0_0facebook::ABI49_0_0React::SurfaceHandler const &)surfaceHandler;

/*
 * Deprecated.
 * Use `ABI49_0_0RCTMountingTransactionObserverCoordinator` instead.
 */
- (void)addObserver:(id<ABI49_0_0RCTSurfacePresenterObserver>)observer;
- (void)removeObserver:(id<ABI49_0_0RCTSurfacePresenterObserver>)observer;

/*
 * Please do not use this, this will be deleted soon.
 */
- (nullable UIView *)findComponentViewWithTag_DO_NOT_USE_DEPRECATED:(NSInteger)tag;

@end

NS_ASSUME_NONNULL_END
