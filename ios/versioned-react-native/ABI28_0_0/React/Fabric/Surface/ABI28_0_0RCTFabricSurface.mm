/**
 * Copyright (c) 2015-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "ABI28_0_0RCTFabricSurface.h"

#import <ReactABI28_0_0/ABI28_0_0RCTBridge.h>

@implementation ABI28_0_0RCTFabricSurface

- (void)unmountReactABI28_0_0ComponentWithBridge:(ABI28_0_0RCTBridge *)bridge rootViewTag:(NSNumber *)rootViewTag
{
  [bridge enqueueJSCall:@"ReactABI28_0_0Fabric"
                 method:@"unmountComponentAtNodeAndRemoveContainer"
                   args:@[rootViewTag]
             completion:NULL];
}

@end
