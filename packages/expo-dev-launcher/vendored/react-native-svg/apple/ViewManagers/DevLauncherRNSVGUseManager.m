/**
 * Copyright (c) 2015-present, Horcrux.
 * All rights reserved.
 *
 * This source code is licensed under the MIT-style license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "DevLauncherRNSVGUseManager.h"
#import "DevLauncherRNSVGUse.h"

@implementation DevLauncherRNSVGUseManager

- (DevLauncherRNSVGNode *)node
{
  return [DevLauncherRNSVGUse new];
}

RCT_EXPORT_VIEW_PROPERTY(href, NSString)
RCT_CUSTOM_VIEW_PROPERTY(x, id, DevLauncherRNSVGUse)
{
    view.x = [RCTConvert DevLauncherRNSVGLength:json];
}
RCT_CUSTOM_VIEW_PROPERTY(y, id, DevLauncherRNSVGUse)
{
    view.y = [RCTConvert DevLauncherRNSVGLength:json];
}
RCT_EXPORT_VIEW_PROPERTY(useheight, DevLauncherRNSVGLength*)
RCT_EXPORT_VIEW_PROPERTY(usewidth, DevLauncherRNSVGLength*)
RCT_CUSTOM_VIEW_PROPERTY(height, id, DevLauncherRNSVGUse)
{
    view.useheight = [RCTConvert DevLauncherRNSVGLength:json];
}
RCT_CUSTOM_VIEW_PROPERTY(width, id, DevLauncherRNSVGUse)
{
    view.usewidth = [RCTConvert DevLauncherRNSVGLength:json];
}

@end
