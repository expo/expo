/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <ABI42_0_0React/ABI42_0_0RCTDefines.h>

// In debug builds, the red box is enabled by default but it is further
// customizable using this method. However, this method only has an effect in
// builds where ABI42_0_0RCTRedBox is actually compiled in.
ABI42_0_0RCT_EXTERN void ABI42_0_0RCTRedBoxSetEnabled(BOOL enabled);
ABI42_0_0RCT_EXTERN BOOL ABI42_0_0RCTRedBoxGetEnabled(void);
