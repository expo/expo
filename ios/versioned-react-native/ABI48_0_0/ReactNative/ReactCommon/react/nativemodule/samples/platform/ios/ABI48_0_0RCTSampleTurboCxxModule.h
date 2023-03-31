/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#import <ABI48_0_0React/ABI48_0_0RCTCxxModule.h>
#import <ABI48_0_0ReactCommon/ABI48_0_0RCTTurboModule.h>

/**
 * Sample backward-compatible ABI48_0_0RCTCxxModule-based module.
 * With jsi::HostObject, this class is no longer necessary, but the system supports it for
 * backward compatibility.
 */
@interface ABI48_0_0RCTSampleTurboCxxModule_v1 : ABI48_0_0RCTCxxModule <ABI48_0_0RCTTurboModule>

@end

/**
 * Second variant of a sample backward-compatible ABI48_0_0RCTCxxModule-based module.
 */
@interface ABI48_0_0RCTSampleTurboCxxModule_v2 : ABI48_0_0RCTCxxModule <ABI48_0_0RCTTurboModule>

@end
