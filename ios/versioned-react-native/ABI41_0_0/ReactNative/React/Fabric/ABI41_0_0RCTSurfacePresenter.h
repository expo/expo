/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <UIKit/UIKit.h>

#import <ABI41_0_0React/ABI41_0_0RCTPrimitives.h>
#import <ABI41_0_0React/ABI41_0_0RCTSurfacePresenterStub.h>
#import <ABI41_0_0React/ABI41_0_0RCTSurfaceStage.h>
#import <ABI41_0_0React/utils/ContextContainer.h>
#import <ABI41_0_0React/utils/RuntimeExecutor.h>

NS_ASSUME_NONNULL_BEGIN

@class ABI41_0_0RCTFabricSurface;
@class ABI41_0_0RCTImageLoader;
@class ABI41_0_0RCTMountingManager;

/**
 * Coordinates presenting of ABI41_0_0React Native Surfaces and represents application
 * facing interface of running ABI41_0_0React Native core.
 */
@interface ABI41_0_0RCTSurfacePresenter : NSObject

- (instancetype)initWithContextContainer:(ABI41_0_0facebook::ABI41_0_0React::ContextContainer::Shared)contextContainer
                         runtimeExecutor:(ABI41_0_0facebook::ABI41_0_0React::RuntimeExecutor)runtimeExecutor;

@property (nonatomic) ABI41_0_0facebook::ABI41_0_0React::ContextContainer::Shared contextContainer;
@property (nonatomic) ABI41_0_0facebook::ABI41_0_0React::RuntimeExecutor runtimeExecutor;

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

@interface ABI41_0_0RCTSurfacePresenter (Surface) <ABI41_0_0RCTSurfacePresenterStub>

/**
 * Surface uses these methods to register itself in the Presenter.
 */
- (void)registerSurface:(ABI41_0_0RCTFabricSurface *)surface;
- (void)unregisterSurface:(ABI41_0_0RCTFabricSurface *)surface;

- (void)setProps:(NSDictionary *)props surface:(ABI41_0_0RCTFabricSurface *)surface;

- (nullable ABI41_0_0RCTFabricSurface *)surfaceForRootTag:(ABI41_0_0ReactTag)rootTag;

/**
 * Measures the Surface with given constraints.
 */
- (CGSize)sizeThatFitsMinimumSize:(CGSize)minimumSize
                      maximumSize:(CGSize)maximumSize
                          surface:(ABI41_0_0RCTFabricSurface *)surface;

/**
 * Sets `minimumSize` and `maximumSize` layout constraints for the Surface.
 */
- (void)setMinimumSize:(CGSize)minimumSize maximumSize:(CGSize)maximumSize surface:(ABI41_0_0RCTFabricSurface *)surface;

- (BOOL)synchronouslyUpdateViewOnUIThread:(NSNumber *)ABI41_0_0ReactTag props:(NSDictionary *)props;

- (BOOL)synchronouslyWaitSurface:(ABI41_0_0RCTFabricSurface *)surface timeout:(NSTimeInterval)timeout;

- (void)addObserver:(id<ABI41_0_0RCTSurfacePresenterObserver>)observer;

- (void)removeObserver:(id<ABI41_0_0RCTSurfacePresenterObserver>)observer;

@end

NS_ASSUME_NONNULL_END
