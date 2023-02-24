/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "ABI47_0_0RCTDevLoadingViewSetEnabled.h"

#if ABI47_0_0RCT_DEV | ABI47_0_0RCT_ENABLE_LOADING_VIEW
static BOOL isDevLoadingViewEnabled = YES;
#else
static BOOL isDevLoadingViewEnabled = NO;
#endif

void ABI47_0_0RCTDevLoadingViewSetEnabled(BOOL enabled)
{
  isDevLoadingViewEnabled = enabled;
}

BOOL ABI47_0_0RCTDevLoadingViewGetEnabled()
{
  return isDevLoadingViewEnabled;
}
