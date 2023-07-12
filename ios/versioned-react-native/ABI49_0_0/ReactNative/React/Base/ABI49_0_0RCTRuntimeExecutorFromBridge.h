/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <Foundation/Foundation.h>
#ifdef __cplusplus
#import <ABI49_0_0ReactCommon/ABI49_0_0RuntimeExecutor.h>

NS_ASSUME_NONNULL_BEGIN

@class ABI49_0_0RCTBridge;

ABI49_0_0facebook::ABI49_0_0React::RuntimeExecutor ABI49_0_0RCTRuntimeExecutorFromBridge(ABI49_0_0RCTBridge *bridge);

NS_ASSUME_NONNULL_END
#endif
