/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <objc/runtime.h>

#import <ABI41_0_0React/ABI41_0_0RCTBridge.h>

NS_ASSUME_NONNULL_BEGIN

// TODO: Eventually this should go away and files should just include ABI41_0_0RCTSurfacePresenter.h, but
// that pulls in all of fabric which doesn't compile in open source yet, so we mirror the protocol
// and duplicate the category here for now.

@protocol ABI41_0_0RCTSurfacePresenterObserver <NSObject>

@optional

- (void)willMountComponentsWithRootTag:(NSInteger)rootTag;
- (void)didMountComponentsWithRootTag:(NSInteger)rootTag;

@end

@protocol ABI41_0_0RCTSurfacePresenterStub <NSObject>

- (BOOL)synchronouslyUpdateViewOnUIThread:(NSNumber *)ABI41_0_0ReactTag props:(NSDictionary *)props;
- (void)addObserver:(id<ABI41_0_0RCTSurfacePresenterObserver>)observer;
- (void)removeObserver:(id<ABI41_0_0RCTSurfacePresenterObserver>)observer;

@end

@interface ABI41_0_0RCTBridge (ABI41_0_0RCTSurfacePresenterStub)

- (id<ABI41_0_0RCTSurfacePresenterStub>)surfacePresenter;
- (void)setSurfacePresenter:(id<ABI41_0_0RCTSurfacePresenterStub>)presenter;

@end

NS_ASSUME_NONNULL_END
