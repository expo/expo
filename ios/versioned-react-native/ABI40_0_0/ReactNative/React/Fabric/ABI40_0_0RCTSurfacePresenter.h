/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <UIKit/UIKit.h>

#import <ABI40_0_0React/ABI40_0_0RCTPrimitives.h>
#import <ABI40_0_0React/ABI40_0_0RCTSurfacePresenterStub.h>
#import <ABI40_0_0React/ABI40_0_0RCTSurfaceStage.h>
#import <ABI40_0_0React/utils/ContextContainer.h>
#import <ABI40_0_0React/utils/RuntimeExecutor.h>

NS_ASSUME_NONNULL_BEGIN

@class ABI40_0_0RCTFabricSurface;
@class ABI40_0_0RCTImageLoader;
@class ABI40_0_0RCTMountingManager;

/**
 * Coordinates presenting of ABI40_0_0React Native Surfaces and represents application
 * facing interface of running ABI40_0_0React Native core.
 */
@interface ABI40_0_0RCTSurfacePresenter : NSObject

- (instancetype)initWithContextContainer:(ABI40_0_0facebook::ABI40_0_0React::ContextContainer::Shared)contextContainer
                         runtimeExecutor:(ABI40_0_0facebook::ABI40_0_0React::RuntimeExecutor)runtimeExecutor;

@property (nonatomic) ABI40_0_0facebook::ABI40_0_0React::ContextContainer::Shared contextContainer;
@property (nonatomic) ABI40_0_0facebook::ABI40_0_0React::RuntimeExecutor runtimeExecutor;

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

@interface ABI40_0_0RCTSurfacePresenter (Surface) <ABI40_0_0RCTSurfacePresenterStub>

/**
 * Surface uses these methods to register itself in the Presenter.
 */
- (void)registerSurface:(ABI40_0_0RCTFabricSurface *)surface;
- (void)unregisterSurface:(ABI40_0_0RCTFabricSurface *)surface;

- (void)setProps:(NSDictionary *)props surface:(ABI40_0_0RCTFabricSurface *)surface;

- (nullable ABI40_0_0RCTFabricSurface *)surfaceForRootTag:(ABI40_0_0ReactTag)rootTag;

/**
 * Measures the Surface with given constraints.
 */
- (CGSize)sizeThatFitsMinimumSize:(CGSize)minimumSize
                      maximumSize:(CGSize)maximumSize
                          surface:(ABI40_0_0RCTFabricSurface *)surface;

/**
 * Sets `minimumSize` and `maximumSize` layout constraints for the Surface.
 */
- (void)setMinimumSize:(CGSize)minimumSize maximumSize:(CGSize)maximumSize surface:(ABI40_0_0RCTFabricSurface *)surface;

- (BOOL)synchronouslyUpdateViewOnUIThread:(NSNumber *)ABI40_0_0ReactTag props:(NSDictionary *)props;

- (BOOL)synchronouslyWaitSurface:(ABI40_0_0RCTFabricSurface *)surface timeout:(NSTimeInterval)timeout;

- (void)addObserver:(id<ABI40_0_0RCTSurfacePresenterObserver>)observer;

- (void)removeObserver:(id<ABI40_0_0RCTSurfacePresenterObserver>)observer;

@end

NS_ASSUME_NONNULL_END
