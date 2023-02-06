/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <Foundation/Foundation.h>

#import "ABI48_0_0RCTNativeSampleTurboModuleSpec.h"

/**
 * Sample iOS-specific impl of a TurboModule, conforming to the spec protocol.
 * This class is also 100% compatible with the NativeModule system.
 */
@interface ABI48_0_0RCTSampleTurboModule : NSObject <ABI48_0_0NativeSampleTurboModuleSpec>

@end
