/**
 * Copyright (c) 2015-present, Horcrux.
 * All rights reserved.
 *
 * This source code is licensed under the MIT-style license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "ABI49_0_0RNSVGTSpanManager.h"

#import "ABI49_0_0RCTConvert+RNSVG.h"
#import "ABI49_0_0RNSVGTSpan.h"

@implementation ABI49_0_0RNSVGTSpanManager

ABI49_0_0RCT_EXPORT_MODULE()

- (ABI49_0_0RNSVGRenderable *)node
{
  return [ABI49_0_0RNSVGTSpan new];
}

ABI49_0_0RCT_EXPORT_VIEW_PROPERTY(content, NSString)

@end
