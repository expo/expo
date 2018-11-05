/**
 * Copyright (c) 2015-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "ABI30_0_0RCTFabricSurface.h"

#import <ReactABI30_0_0/ABI30_0_0RCTBridge.h>

@implementation ABI30_0_0RCTFabricSurface

- (void)unmountReactABI30_0_0ComponentWithBridge:(ABI30_0_0RCTBridge *)bridge rootViewTag:(NSNumber *)rootViewTag
{
  [bridge enqueueJSCall:@"ReactABI30_0_0Fabric"
                 method:@"unmountComponentAtNodeAndRemoveContainer"
                   args:@[rootViewTag]
             completion:NULL];
}

@end
