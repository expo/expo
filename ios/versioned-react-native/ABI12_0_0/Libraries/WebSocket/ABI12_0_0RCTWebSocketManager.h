/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#import "ABI12_0_0RCTDefines.h"

#if ABI12_0_0RCT_DEV // Only supported in dev mode

#import "ABI12_0_0RCTWebSocketProxy.h"

@interface ABI12_0_0RCTWebSocketManager : NSObject <ABI12_0_0RCTWebSocketProxy>
@end

#endif
