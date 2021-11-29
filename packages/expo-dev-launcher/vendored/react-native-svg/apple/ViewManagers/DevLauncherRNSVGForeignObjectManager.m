/**
 * Copyright (c) 2015-present, Horcrux.
 * All rights reserved.
 *
 * This source code is licensed under the MIT-style license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "DevLauncherRNSVGForeignObjectManager.h"
#import "DevLauncherRNSVGForeignObject.h"

@implementation DevLauncherRNSVGForeignObjectManager

- (DevLauncherRNSVGForeignObject *)node
{
    return [DevLauncherRNSVGForeignObject new];
}

RCT_EXPORT_VIEW_PROPERTY(x, DevLauncherRNSVGLength*)
RCT_EXPORT_VIEW_PROPERTY(y, DevLauncherRNSVGLength*)
RCT_EXPORT_VIEW_PROPERTY(foreignObjectheight, DevLauncherRNSVGLength*)
RCT_EXPORT_VIEW_PROPERTY(foreignObjectwidth, DevLauncherRNSVGLength*)
RCT_CUSTOM_VIEW_PROPERTY(height, id, DevLauncherRNSVGForeignObject)
{
    view.foreignObjectheight = [RCTConvert DevLauncherRNSVGLength:json];
}
RCT_CUSTOM_VIEW_PROPERTY(width, id, DevLauncherRNSVGForeignObject)
{
    view.foreignObjectwidth = [RCTConvert DevLauncherRNSVGLength:json];
}

@end
