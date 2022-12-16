/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <ABI46_0_0React/ABI46_0_0RCTDefines.h>

// In debug builds, the red box is enabled by default but it is further
// customizable using this method. However, this method only has an effect in
// builds where ABI46_0_0RCTRedBox is actually compiled in.
ABI46_0_0RCT_EXTERN void ABI46_0_0RCTRedBoxSetEnabled(BOOL enabled);
ABI46_0_0RCT_EXTERN BOOL ABI46_0_0RCTRedBoxGetEnabled(void);
