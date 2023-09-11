/**
 * Copyright (c) 2015-present, Horcrux.
 * All rights reserved.
 *
 * This source code is licensed under the MIT-style license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "RNSVGGroupManager.h"
#import "RNSVGCGFCRule.h"
#import "RNSVGGroup.h"

@implementation RNSVGGroupManager

RCT_EXPORT_MODULE()

- (RNSVGNode *)node
{
  return [RNSVGGroup new];
}

RCT_EXPORT_VIEW_PROPERTY(font, NSDictionary)

RCT_CUSTOM_VIEW_PROPERTY(fontSize, id, RNSVGGroup)
{
  if ([json isKindOfClass:[NSString class]]) {
    NSString *stringValue = (NSString *)json;
    view.font = @{@"fontSize" : stringValue};
  } else {
    NSNumber *number = (NSNumber *)json;
    double num = [number doubleValue];
    view.font = @{@"fontSize" : [NSNumber numberWithDouble:num]};
  }
}

RCT_CUSTOM_VIEW_PROPERTY(fontWeight, id, RNSVGGroup)
{
  if ([json isKindOfClass:[NSString class]]) {
    NSString *stringValue = (NSString *)json;
    view.font = @{@"fontWeight" : stringValue};
  } else {
    NSNumber *number = (NSNumber *)json;
    double num = [number doubleValue];
    view.font = @{@"fontWeight" : [NSNumber numberWithDouble:num]};
  }
}

@end
