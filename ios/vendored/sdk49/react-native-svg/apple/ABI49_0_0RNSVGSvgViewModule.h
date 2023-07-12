/**
 * Copyright (c) 2015-present, Horcrux.
 * All rights reserved.
 *
 * This source code is licensed under the MIT-style license found in the
 * LICENSE file in the root directory of this source tree.
 */

#ifdef ABI49_0_0RCT_NEW_ARCH_ENABLED
#import <rnsvg/rnsvg.h>
#else
#import <ABI49_0_0React/ABI49_0_0RCTBridge.h>
#endif

@interface ABI49_0_0RNSVGSvgViewModule : NSObject
#ifdef ABI49_0_0RCT_NEW_ARCH_ENABLED
                                <NativeSvgViewModuleSpec>
#else
                                <ABI49_0_0RCTBridgeModule>
#endif
@end
