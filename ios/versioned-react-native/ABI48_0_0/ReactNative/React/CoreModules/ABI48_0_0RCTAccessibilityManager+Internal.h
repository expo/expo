/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "ABI48_0_0RCTAccessibilityManager.h"

#import <ABI48_0_0React/ABI48_0_0RCTDefines.h>

NS_ASSUME_NONNULL_BEGIN

ABI48_0_0RCT_EXTERN_C_BEGIN

// Only to be used for testing and internal tooling. Do not use this in
// production.
void ABI48_0_0RCTAccessibilityManagerSetIsVoiceOverEnabled(
    ABI48_0_0RCTAccessibilityManager *accessibiltyManager,
    BOOL isVoiceOverEnabled);

ABI48_0_0RCT_EXTERN_C_END

NS_ASSUME_NONNULL_END
