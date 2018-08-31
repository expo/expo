/**
 * Copyright (c) 2015-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <ReactABI30_0_0/ABI30_0_0RCTDefines.h>
#import <ReactABI30_0_0/ABI30_0_0RCTJavaScriptExecutor.h>

#if ABI30_0_0RCT_DEV // Debug executors are only supported in dev mode

@interface ABI30_0_0RCTWebSocketExecutor : NSObject <ABI30_0_0RCTJavaScriptExecutor>

- (instancetype)initWithURL:(NSURL *)URL;

@end

#endif
