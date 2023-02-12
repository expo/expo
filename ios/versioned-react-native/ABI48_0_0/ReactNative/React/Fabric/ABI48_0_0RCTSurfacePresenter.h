/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <UIKit/UIKit.h>

#import <ABI48_0_0React/ABI48_0_0RCTPrimitives.h>
#import <ABI48_0_0React/ABI48_0_0RCTSurfacePresenterStub.h>
#import <ABI48_0_0React/ABI48_0_0RCTSurfaceStage.h>
#import <ABI48_0_0ReactCommon/ABI48_0_0RuntimeExecutor.h>
#import <ABI48_0_0React/ABI48_0_0renderer/scheduler/SurfaceHandler.h>
#import <ABI48_0_0React/ABI48_0_0utils/ContextContainer.h>

NS_ASSUME_NONNULL_BEGIN

@class ABI48_0_0RCTFabricSurface;
@class ABI48_0_0RCTImageLoader;
@class ABI48_0_0RCTMountingManager;
@class ABI48_0_0RCTScheduler;

/**
 * Coordinates presenting of ABI48_0_0React Native Surfaces and represents application
 * facing interface of running ABI48_0_0React Native core.
 */
@interface ABI48_0_0RCTSurfacePresenter : NSObject

- (instancetype)initWithContextContainer:(ABI48_0_0facebook::ABI48_0_0React::ContextContainer::Shared)contextContainer
                         runtimeExecutor:(ABI48_0_0facebook::ABI48_0_0React::RuntimeExecutor)runtimeExecutor
              bridgelessBindingsExecutor:(std::optional<ABI48_0_0facebook::ABI48_0_0React::RuntimeExecutor>)bridgelessBindingsExecutor;

@property (nonatomic) ABI48_0_0facebook::ABI48_0_0React::ContextContainer::Shared contextContainer;
@property (nonatomic) ABI48_0_0facebook::ABI48_0_0React::RuntimeExecutor runtimeExecutor;

/*
 * Suspends/resumes all surfaces associated with the presenter.
 * Suspending is a process or gracefull stopping all surfaces and destroying all underlying infrastructure
 * with a future possibility of recreating the infrastructure and restarting the surfaces from scratch.
 * Suspending is usually a part of a bundle reloading process.
 * Can be called on any thread.
 */
- (BOOL)suspend;
- (BOOL)resume;

@end

@interface ABI48_0_0RCTSurfacePresenter (Surface) <ABI48_0_0RCTSurfacePresenterStub>

/*
 * Surface uses these methods to register itself in the Presenter.
 */
- (void)registerSurface:(ABI48_0_0RCTFabricSurface *)surface;
- (void)unregisterSurface:(ABI48_0_0RCTFabricSurface *)surface;

@property (readonly) ABI48_0_0RCTMountingManager *mountingManager;
@property (readonly, nullable) ABI48_0_0RCTScheduler *scheduler;

/*
 * Allow callers to initialize a new fabric surface without adding Fabric as a Buck dependency.
 */
- (id<ABI48_0_0RCTSurfaceProtocol>)createFabricSurfaceForModuleName:(NSString *)moduleName
                                         initialProperties:(NSDictionary *)initialProperties;

- (nullable ABI48_0_0RCTFabricSurface *)surfaceForRootTag:(ABI48_0_0ReactTag)rootTag;

- (BOOL)synchronouslyUpdateViewOnUIThread:(NSNumber *)ABI48_0_0ReactTag props:(NSDictionary *)props;

- (void)setupAnimationDriverWithSurfaceHandler:(ABI48_0_0facebook::ABI48_0_0React::SurfaceHandler const &)surfaceHandler;

/*
 * Deprecated.
 * Use `ABI48_0_0RCTMountingTransactionObserverCoordinator` instead.
 */
- (void)addObserver:(id<ABI48_0_0RCTSurfacePresenterObserver>)observer;
- (void)removeObserver:(id<ABI48_0_0RCTSurfacePresenterObserver>)observer;

/*
 * Please do not use this, this will be deleted soon.
 */
- (nullable UIView *)findComponentViewWithTag_DO_NOT_USE_DEPRECATED:(NSInteger)tag;

@end

NS_ASSUME_NONNULL_END
