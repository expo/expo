/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <UIKit/UIKit.h>

#import <ABI43_0_0React/ABI43_0_0RCTPrimitives.h>
#import <ABI43_0_0React/ABI43_0_0RCTSurfacePresenterStub.h>
#import <ABI43_0_0React/ABI43_0_0RCTSurfaceStage.h>
#import <ABI43_0_0ReactCommon/ABI43_0_0RuntimeExecutor.h>
#import <ABI43_0_0React/ABI43_0_0utils/ContextContainer.h>

NS_ASSUME_NONNULL_BEGIN

@class ABI43_0_0RCTFabricSurface;
@class ABI43_0_0RCTImageLoader;
@class ABI43_0_0RCTMountingManager;

/**
 * Coordinates presenting of ABI43_0_0React Native Surfaces and represents application
 * facing interface of running ABI43_0_0React Native core.
 */
@interface ABI43_0_0RCTSurfacePresenter : NSObject

- (instancetype)initWithContextContainer:(ABI43_0_0facebook::ABI43_0_0React::ContextContainer::Shared)contextContainer
                         runtimeExecutor:(ABI43_0_0facebook::ABI43_0_0React::RuntimeExecutor)runtimeExecutor;

@property (nonatomic) ABI43_0_0facebook::ABI43_0_0React::ContextContainer::Shared contextContainer;
@property (nonatomic) ABI43_0_0facebook::ABI43_0_0React::RuntimeExecutor runtimeExecutor;

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

@interface ABI43_0_0RCTSurfacePresenter (Surface) <ABI43_0_0RCTSurfacePresenterStub>

/**
 * Surface uses these methods to register itself in the Presenter.
 */
- (void)registerSurface:(ABI43_0_0RCTFabricSurface *)surface;
- (void)unregisterSurface:(ABI43_0_0RCTFabricSurface *)surface;

- (void)setProps:(NSDictionary *)props surface:(ABI43_0_0RCTFabricSurface *)surface;

- (nullable ABI43_0_0RCTFabricSurface *)surfaceForRootTag:(ABI43_0_0ReactTag)rootTag;

/**
 * Measures the Surface with given constraints.
 */
- (CGSize)sizeThatFitsMinimumSize:(CGSize)minimumSize
                      maximumSize:(CGSize)maximumSize
                          surface:(ABI43_0_0RCTFabricSurface *)surface;

/**
 * Sets `minimumSize` and `maximumSize` layout constraints for the Surface.
 */
- (void)setMinimumSize:(CGSize)minimumSize maximumSize:(CGSize)maximumSize surface:(ABI43_0_0RCTFabricSurface *)surface;

- (BOOL)synchronouslyUpdateViewOnUIThread:(NSNumber *)ABI43_0_0ReactTag props:(NSDictionary *)props;

- (BOOL)synchronouslyWaitSurface:(ABI43_0_0RCTFabricSurface *)surface timeout:(NSTimeInterval)timeout;

- (void)addObserver:(id<ABI43_0_0RCTSurfacePresenterObserver>)observer;

- (void)removeObserver:(id<ABI43_0_0RCTSurfacePresenterObserver>)observer;

/*
 * Please do not use this, this will be deleted soon.
 */
- (nullable UIView *)findComponentViewWithTag_DO_NOT_USE_DEPRECATED:(NSInteger)tag;

@end

NS_ASSUME_NONNULL_END
