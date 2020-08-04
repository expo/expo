/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <ABI38_0_0React/ABI38_0_0RCTDefines.h>

// In debug builds, the red box is enabled by default but it is further customizable using this method.
// However, this method only has an effect in builds where ABI38_0_0RCTRedBox is actually compiled in.
ABI38_0_0RCT_EXTERN void ABI38_0_0RCTRedBoxSetEnabled(BOOL enabled);
ABI38_0_0RCT_EXTERN BOOL ABI38_0_0RCTRedBoxGetEnabled(void);
