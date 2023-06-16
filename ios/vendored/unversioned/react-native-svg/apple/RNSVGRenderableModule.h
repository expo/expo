/**
 * Copyright (c) 2015-present, Horcrux.
 * All rights reserved.
 *
 * This source code is licensed under the MIT-style license found in the
 * LICENSE file in the root directory of this source tree.
 */

#ifdef RCT_NEW_ARCH_ENABLED
#import <rnsvg/rnsvg.h>
#else
#import <React/RCTBridge.h>
#endif

@interface RNSVGRenderableModule : NSObject
#ifdef RCT_NEW_ARCH_ENABLED
                                   <NativeSvgRenderableModuleSpec>
#else
                                   <RCTBridgeModule>
#endif
@end
