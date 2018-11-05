/**
 * Copyright (c) 2015-present, Horcrux.
 * All rights reserved.
 *
 * This source code is licensed under the MIT-style license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "ABI29_0_0RNSVGTSpanManager.h"

#import "ABI29_0_0RNSVGTSpan.h"
#import "ABI29_0_0RCTConvert+RNSVG.h"

@implementation ABI29_0_0RNSVGTSpanManager

ABI29_0_0RCT_EXPORT_MODULE()

- (ABI29_0_0RNSVGRenderable *)node
{
  return [ABI29_0_0RNSVGTSpan new];
}

ABI29_0_0RCT_EXPORT_VIEW_PROPERTY(content, NSString)

@end
