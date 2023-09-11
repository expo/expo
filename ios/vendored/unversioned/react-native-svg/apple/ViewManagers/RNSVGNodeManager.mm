/**
 * Copyright (c) 2015-present, Horcrux.
 * All rights reserved.
 *
 * This source code is licensed under the MIT-style license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "RNSVGNodeManager.h"
#import "RNSVGNode.h"

#import <React/RCTConvert+Transform.h>

@implementation RNSVGNodeManager

RCT_EXPORT_MODULE()

- (RNSVGNode *)node
{
  return [RNSVGNode new];
}

- (RNSVGView *)view
{
  return [self node];
}

RCT_EXPORT_VIEW_PROPERTY(name, NSString)
RCT_EXPORT_VIEW_PROPERTY(opacity, CGFloat)
RCT_EXPORT_VIEW_PROPERTY(matrix, CGAffineTransform)
RCT_CUSTOM_VIEW_PROPERTY(transform, CATransform3D, RNSVGNode)
{
  CATransform3D transform3d = json ? [RCTConvert CATransform3D:json] : defaultView.layer.transform;
  CGAffineTransform transform = CATransform3DGetAffineTransform(transform3d);
  view.invTransform = CGAffineTransformInvert(transform);
  view.transforms = transform;
  [view invalidate];
}
RCT_EXPORT_VIEW_PROPERTY(mask, NSString)
RCT_EXPORT_VIEW_PROPERTY(markerStart, NSString)
RCT_EXPORT_VIEW_PROPERTY(markerMid, NSString)
RCT_EXPORT_VIEW_PROPERTY(markerEnd, NSString)
RCT_EXPORT_VIEW_PROPERTY(clipPath, NSString)
RCT_EXPORT_VIEW_PROPERTY(clipRule, RNSVGCGFCRule)
RCT_EXPORT_VIEW_PROPERTY(responsible, BOOL)
RCT_EXPORT_VIEW_PROPERTY(onLayout, RCTDirectEventBlock)

RCT_CUSTOM_SHADOW_PROPERTY(top, id, RNSVGNode) {}
RCT_CUSTOM_SHADOW_PROPERTY(right, id, RNSVGNode) {}
RCT_CUSTOM_SHADOW_PROPERTY(start, id, RNSVGNode) {}
RCT_CUSTOM_SHADOW_PROPERTY(end, id, RNSVGNode) {}
RCT_CUSTOM_SHADOW_PROPERTY(bottom, id, RNSVGNode) {}
RCT_CUSTOM_SHADOW_PROPERTY(left, id, RNSVGNode) {}

RCT_CUSTOM_SHADOW_PROPERTY(width, id, RNSVGNode) {}
RCT_CUSTOM_SHADOW_PROPERTY(height, id, RNSVGNode) {}

RCT_CUSTOM_SHADOW_PROPERTY(minWidth, id, RNSVGNode) {}
RCT_CUSTOM_SHADOW_PROPERTY(maxWidth, id, RNSVGNode) {}
RCT_CUSTOM_SHADOW_PROPERTY(minHeight, id, RNSVGNode) {}
RCT_CUSTOM_SHADOW_PROPERTY(maxHeight, id, RNSVGNode) {}

RCT_CUSTOM_SHADOW_PROPERTY(borderTopWidth, id, RNSVGNode) {}
RCT_CUSTOM_SHADOW_PROPERTY(borderRightWidth, id, RNSVGNode) {}
RCT_CUSTOM_SHADOW_PROPERTY(borderBottomWidth, id, RNSVGNode) {}
RCT_CUSTOM_SHADOW_PROPERTY(borderLeftWidth, id, RNSVGNode) {}
RCT_CUSTOM_SHADOW_PROPERTY(borderStartWidth, id, RNSVGNode) {}
RCT_CUSTOM_SHADOW_PROPERTY(borderEndWidth, id, RNSVGNode) {}
RCT_CUSTOM_SHADOW_PROPERTY(borderWidth, id, RNSVGNode) {}

RCT_CUSTOM_SHADOW_PROPERTY(marginTop, id, RNSVGNode) {}
RCT_CUSTOM_SHADOW_PROPERTY(marginRight, id, RNSVGNode) {}
RCT_CUSTOM_SHADOW_PROPERTY(marginBottom, id, RNSVGNode) {}
RCT_CUSTOM_SHADOW_PROPERTY(marginLeft, id, RNSVGNode) {}
RCT_CUSTOM_SHADOW_PROPERTY(marginStart, id, RNSVGNode) {}
RCT_CUSTOM_SHADOW_PROPERTY(marginEnd, id, RNSVGNode) {}
RCT_CUSTOM_SHADOW_PROPERTY(marginVertical, id, RNSVGNode) {}
RCT_CUSTOM_SHADOW_PROPERTY(marginHorizontal, id, RNSVGNode) {}
RCT_CUSTOM_SHADOW_PROPERTY(margin, id, RNSVGNode) {}

RCT_CUSTOM_SHADOW_PROPERTY(paddingTop, id, RNSVGNode) {}
RCT_CUSTOM_SHADOW_PROPERTY(paddingRight, id, RNSVGNode) {}
RCT_CUSTOM_SHADOW_PROPERTY(paddingBottom, id, RNSVGNode) {}
RCT_CUSTOM_SHADOW_PROPERTY(paddingLeft, id, RNSVGNode) {}
RCT_CUSTOM_SHADOW_PROPERTY(paddingStart, id, RNSVGNode) {}
RCT_CUSTOM_SHADOW_PROPERTY(paddingEnd, id, RNSVGNode) {}
RCT_CUSTOM_SHADOW_PROPERTY(paddingVertical, id, RNSVGNode) {}
RCT_CUSTOM_SHADOW_PROPERTY(paddingHorizontal, id, RNSVGNode) {}
RCT_CUSTOM_SHADOW_PROPERTY(padding, id, RNSVGNode) {}

RCT_CUSTOM_SHADOW_PROPERTY(flex, id, RNSVGNode) {}
RCT_CUSTOM_SHADOW_PROPERTY(flexGrow, id, RNSVGNode) {}
RCT_CUSTOM_SHADOW_PROPERTY(flexShrink, id, RNSVGNode) {}
RCT_CUSTOM_SHADOW_PROPERTY(flexBasis, id, RNSVGNode) {}
RCT_CUSTOM_SHADOW_PROPERTY(flexDirection, id, RNSVGNode) {}
RCT_CUSTOM_SHADOW_PROPERTY(flexWrap, id, RNSVGNode) {}
RCT_CUSTOM_SHADOW_PROPERTY(justifyContent, id, RNSVGNode) {}
RCT_CUSTOM_SHADOW_PROPERTY(alignItems, id, RNSVGNode) {}
RCT_CUSTOM_SHADOW_PROPERTY(alignSelf, id, RNSVGNode) {}
RCT_CUSTOM_SHADOW_PROPERTY(alignContent, id, RNSVGNode) {}
RCT_CUSTOM_SHADOW_PROPERTY(position, id, RNSVGNode) {}
RCT_CUSTOM_SHADOW_PROPERTY(aspectRatio, id, RNSVGNode) {}

RCT_CUSTOM_SHADOW_PROPERTY(overflow, id, RNSVGNode) {}
RCT_CUSTOM_SHADOW_PROPERTY(display, id, RNSVGNode) {}
RCT_CUSTOM_VIEW_PROPERTY(display, id, RNSVGNode)
{
  view.display = json;
}

RCT_CUSTOM_SHADOW_PROPERTY(direction, id, RNSVGNode) {}

RCT_CUSTOM_VIEW_PROPERTY(pointerEvents, RCTPointerEvents, RNSVGNode)
{
  view.pointerEvents = json ? [RCTConvert RCTPointerEvents:json] : defaultView.pointerEvents;
}

@end
