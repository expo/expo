/**
 * Copyright (c) 2015-present, Horcrux.
 * All rights reserved.
 *
 * This source code is licensed under the MIT-style license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "DevLauncherRNSVGTSpanManager.h"

#import "DevLauncherRNSVGTSpan.h"
#import "RCTConvert+DevLauncherRNSVG.h"

@implementation DevLauncherRNSVGTSpanManager

- (DevLauncherRNSVGRenderable *)node
{
  return [DevLauncherRNSVGTSpan new];
}

RCT_EXPORT_VIEW_PROPERTY(content, NSString)

@end
