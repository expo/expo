/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <objc/runtime.h>

#import <ABI48_0_0React/ABI48_0_0RCTBridge.h>

@protocol ABI48_0_0RCTSurfaceProtocol;

NS_ASSUME_NONNULL_BEGIN

// TODO: Eventually this should go away and files should just include ABI48_0_0RCTSurfacePresenter.h, but
// that pulls in all of fabric which doesn't compile in open source yet, so we mirror the protocol
// and duplicate the category here for now.

@protocol ABI48_0_0RCTSurfacePresenterObserver <NSObject>

@optional

- (void)willMountComponentsWithRootTag:(NSInteger)rootTag;
- (void)didMountComponentsWithRootTag:(NSInteger)rootTag;

@end

@protocol ABI48_0_0RCTSurfacePresenterStub <NSObject>

- (id<ABI48_0_0RCTSurfaceProtocol>)createFabricSurfaceForModuleName:(NSString *)moduleName
                                         initialProperties:(NSDictionary *)initialProperties;
- (nullable UIView *)findComponentViewWithTag_DO_NOT_USE_DEPRECATED:(NSInteger)tag;
- (BOOL)synchronouslyUpdateViewOnUIThread:(NSNumber *)ABI48_0_0ReactTag props:(NSDictionary *)props;
- (void)addObserver:(id<ABI48_0_0RCTSurfacePresenterObserver>)observer;
- (void)removeObserver:(id<ABI48_0_0RCTSurfacePresenterObserver>)observer;

@end

@interface ABI48_0_0RCTBridge (ABI48_0_0RCTSurfacePresenterStub)

- (id<ABI48_0_0RCTSurfacePresenterStub>)surfacePresenter;
- (void)setSurfacePresenter:(id<ABI48_0_0RCTSurfacePresenterStub>)presenter;

@end

NS_ASSUME_NONNULL_END
