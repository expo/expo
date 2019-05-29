/**
 * Copyright (c) 2015-present, Horcrux.
 * All rights reserved.
 *
 * This source code is licensed under the MIT-style license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "ABI33_0_0RNSVGGroupManager.h"
#import "ABI33_0_0RNSVGCGFCRule.h"
#import "ABI33_0_0RNSVGGroup.h"

@implementation ABI33_0_0RNSVGGroupManager

ABI33_0_0RCT_EXPORT_MODULE()

- (ABI33_0_0RNSVGNode *)node
{
  return [ABI33_0_0RNSVGGroup new];
}

ABI33_0_0RCT_EXPORT_VIEW_PROPERTY(font, NSDictionary)

ABI33_0_0RCT_CUSTOM_VIEW_PROPERTY(fontSize, id, ABI33_0_0RNSVGGroup)
{
    if ([json isKindOfClass:[NSString class]]) {
        NSString *stringValue = (NSString *)json;
        view.font = @{ @"fontSize": stringValue };
    } else {
        NSNumber* number = (NSNumber*)json;
        double num = [number doubleValue];
        view.font = @{@"fontSize": [NSNumber numberWithDouble:num] };
    }
}

@end
