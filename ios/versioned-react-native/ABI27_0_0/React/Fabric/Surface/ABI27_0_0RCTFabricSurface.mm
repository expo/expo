/**
 * Copyright (c) 2015-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "ABI27_0_0RCTFabricSurface.h"

#import <ReactABI27_0_0/ABI27_0_0RCTBridge.h>

@implementation ABI27_0_0RCTFabricSurface

- (void)unmountReactABI27_0_0ComponentWithBridge:(ABI27_0_0RCTBridge *)bridge rootViewTag:(NSNumber *)rootViewTag
{
  [bridge enqueueJSCall:@"ReactABI27_0_0Fabric"
                 method:@"unmountComponentAtNodeAndRemoveContainer"
                   args:@[rootViewTag]
             completion:NULL];
}

@end
