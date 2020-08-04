/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <UIKit/UIKit.h>
#import <memory>

#import <ABI37_0_0React/ABI37_0_0RCTBridge.h>
#import <ABI37_0_0React/ABI37_0_0RCTComponentViewFactory.h>
#import <ABI37_0_0React/ABI37_0_0RCTPrimitives.h>
#import <ABI37_0_0React/ABI37_0_0RCTSurfacePresenterStub.h>
#import <ABI37_0_0React/config/ABI37_0_0ReactNativeConfig.h>
#import <ABI37_0_0React/utils/ContextContainer.h>
#import <ABI37_0_0React/utils/RuntimeExecutor.h>

NS_ASSUME_NONNULL_BEGIN

@class ABI37_0_0RCTFabricSurface;
@class ABI37_0_0RCTImageLoader;
@class ABI37_0_0RCTMountingManager;

/**
 * Coordinates presenting of ABI37_0_0React Native Surfaces and represents application
 * facing interface of running ABI37_0_0React Native core.
 * SurfacePresenter incapsulates a bridge object inside and discourage direct
 * access to it.
 */
@interface ABI37_0_0RCTSurfacePresenter : NSObject

- (instancetype)initWithBridge:(ABI37_0_0RCTBridge *)bridge
                        config:(std::shared_ptr<const ABI37_0_0facebook::ABI37_0_0React::ABI37_0_0ReactNativeConfig>)config
                   imageLoader:(ABI37_0_0RCTImageLoader *)imageLoader
               runtimeExecutor:(ABI37_0_0facebook::ABI37_0_0React::RuntimeExecutor)runtimeExecutor;

@property (nonatomic, readonly) ABI37_0_0RCTComponentViewFactory *componentViewFactory;
@property (nonatomic, readonly) ABI37_0_0facebook::ABI37_0_0React::ContextContainer::Shared contextContainer;

@end

@interface ABI37_0_0RCTSurfacePresenter (Surface) <ABI37_0_0RCTSurfacePresenterStub>

/**
 * Surface uses these methods to register itself in the Presenter.
 */
- (void)registerSurface:(ABI37_0_0RCTFabricSurface *)surface;
/**
 * Starting initiates running, rendering and mounting processes.
 * Should be called after registerSurface and any other surface-specific setup is done
 */
- (void)startSurface:(ABI37_0_0RCTFabricSurface *)surface;
- (void)unregisterSurface:(ABI37_0_0RCTFabricSurface *)surface;
- (void)setProps:(NSDictionary *)props surface:(ABI37_0_0RCTFabricSurface *)surface;

- (nullable ABI37_0_0RCTFabricSurface *)surfaceForRootTag:(ABI37_0_0ReactTag)rootTag;

/**
 * Measures the Surface with given constraints.
 */
- (CGSize)sizeThatFitsMinimumSize:(CGSize)minimumSize
                      maximumSize:(CGSize)maximumSize
                          surface:(ABI37_0_0RCTFabricSurface *)surface;

/**
 * Sets `minimumSize` and `maximumSize` layout constraints for the Surface.
 */
- (void)setMinimumSize:(CGSize)minimumSize maximumSize:(CGSize)maximumSize surface:(ABI37_0_0RCTFabricSurface *)surface;

- (BOOL)synchronouslyUpdateViewOnUIThread:(NSNumber *)ABI37_0_0ReactTag props:(NSDictionary *)props;

- (void)addObserver:(id<ABI37_0_0RCTSurfacePresenterObserver>)observer;

- (void)removeObserver:(id<ABI37_0_0RCTSurfacePresenterObserver>)observer;

@end

NS_ASSUME_NONNULL_END
