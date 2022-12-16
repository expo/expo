/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <UIKit/UIKit.h>

#import <ABI45_0_0React/ABI45_0_0RCTPrimitives.h>
#import <ABI45_0_0React/ABI45_0_0RCTSurfacePresenterStub.h>
#import <ABI45_0_0React/ABI45_0_0RCTSurfaceStage.h>
#import <ABI45_0_0ReactCommon/ABI45_0_0RuntimeExecutor.h>
#import <ABI45_0_0React/ABI45_0_0renderer/scheduler/SurfaceHandler.h>
#import <ABI45_0_0React/ABI45_0_0utils/ContextContainer.h>

NS_ASSUME_NONNULL_BEGIN

@class ABI45_0_0RCTFabricSurface;
@class ABI45_0_0RCTImageLoader;
@class ABI45_0_0RCTMountingManager;

/**
 * Coordinates presenting of ABI45_0_0React Native Surfaces and represents application
 * facing interface of running ABI45_0_0React Native core.
 */
@interface ABI45_0_0RCTSurfacePresenter : NSObject

- (instancetype)initWithContextContainer:(ABI45_0_0facebook::ABI45_0_0React::ContextContainer::Shared)contextContainer
                         runtimeExecutor:(ABI45_0_0facebook::ABI45_0_0React::RuntimeExecutor)runtimeExecutor;

@property (nonatomic) ABI45_0_0facebook::ABI45_0_0React::ContextContainer::Shared contextContainer;
@property (nonatomic) ABI45_0_0facebook::ABI45_0_0React::RuntimeExecutor runtimeExecutor;

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

@interface ABI45_0_0RCTSurfacePresenter (Surface) <ABI45_0_0RCTSurfacePresenterStub>

/*
 * Surface uses these methods to register itself in the Presenter.
 */
- (void)registerSurface:(ABI45_0_0RCTFabricSurface *)surface;
- (void)unregisterSurface:(ABI45_0_0RCTFabricSurface *)surface;

@property (readonly) ABI45_0_0RCTMountingManager *mountingManager;

- (nullable ABI45_0_0RCTFabricSurface *)surfaceForRootTag:(ABI45_0_0ReactTag)rootTag;

- (BOOL)synchronouslyUpdateViewOnUIThread:(NSNumber *)ABI45_0_0ReactTag props:(NSDictionary *)props;

- (void)setupAnimationDriverWithSurfaceHandler:(ABI45_0_0facebook::ABI45_0_0React::SurfaceHandler const &)surfaceHandler;

/*
 * Deprecated.
 * Use `ABI45_0_0RCTMountingTransactionObserverCoordinator` instead.
 */
- (void)addObserver:(id<ABI45_0_0RCTSurfacePresenterObserver>)observer;
- (void)removeObserver:(id<ABI45_0_0RCTSurfacePresenterObserver>)observer;

/*
 * Please do not use this, this will be deleted soon.
 */
- (nullable UIView *)findComponentViewWithTag_DO_NOT_USE_DEPRECATED:(NSInteger)tag;

@end

NS_ASSUME_NONNULL_END
