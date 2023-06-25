/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "ABI49_0_0RCTSurfacePresenterStub.h"

@implementation ABI49_0_0RCTBridge (ABI49_0_0RCTSurfacePresenterStub)

- (id<ABI49_0_0RCTSurfacePresenterStub>)surfacePresenter
{
  return objc_getAssociatedObject(self, @selector(surfacePresenter));
}

- (void)setSurfacePresenter:(id<ABI49_0_0RCTSurfacePresenterStub>)surfacePresenter
{
  objc_setAssociatedObject(self, @selector(surfacePresenter), surfacePresenter, OBJC_ASSOCIATION_RETAIN);
}

@end
