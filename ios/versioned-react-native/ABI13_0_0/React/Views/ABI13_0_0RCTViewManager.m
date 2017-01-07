/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#import "ABI13_0_0RCTViewManager.h"

#import "ABI13_0_0RCTBorderStyle.h"
#import "ABI13_0_0RCTBridge.h"
#import "ABI13_0_0RCTConvert.h"
#import "ABI13_0_0RCTEventDispatcher.h"
#import "ABI13_0_0RCTLog.h"
#import "ABI13_0_0RCTShadowView.h"
#import "ABI13_0_0RCTUIManager.h"
#import "ABI13_0_0RCTUtils.h"
#import "ABI13_0_0RCTView.h"
#import "UIView+ReactABI13_0_0.h"

@implementation ABI13_0_0RCTConvert(UIAccessibilityTraits)

ABI13_0_0RCT_MULTI_ENUM_CONVERTER(UIAccessibilityTraits, (@{
  @"none": @(UIAccessibilityTraitNone),
  @"button": @(UIAccessibilityTraitButton),
  @"link": @(UIAccessibilityTraitLink),
  @"header": @(UIAccessibilityTraitHeader),
  @"search": @(UIAccessibilityTraitSearchField),
  @"image": @(UIAccessibilityTraitImage),
  @"selected": @(UIAccessibilityTraitSelected),
  @"plays": @(UIAccessibilityTraitPlaysSound),
  @"key": @(UIAccessibilityTraitKeyboardKey),
  @"text": @(UIAccessibilityTraitStaticText),
  @"summary": @(UIAccessibilityTraitSummaryElement),
  @"disabled": @(UIAccessibilityTraitNotEnabled),
  @"frequentUpdates": @(UIAccessibilityTraitUpdatesFrequently),
  @"startsMedia": @(UIAccessibilityTraitStartsMediaSession),
  @"adjustable": @(UIAccessibilityTraitAdjustable),
  @"allowsDirectInteraction": @(UIAccessibilityTraitAllowsDirectInteraction),
  @"pageTurn": @(UIAccessibilityTraitCausesPageTurn),
}), UIAccessibilityTraitNone, unsignedLongLongValue)

@end

@implementation ABI13_0_0RCTViewManager

@synthesize bridge = _bridge;

ABI13_0_0RCT_EXPORT_MODULE()

- (dispatch_queue_t)methodQueue
{
  return ABI13_0_0RCTGetUIManagerQueue();
}

- (UIView *)view
{
  return [ABI13_0_0RCTView new];
}

- (ABI13_0_0RCTShadowView *)shadowView
{
  return [ABI13_0_0RCTShadowView new];
}

- (NSArray<NSString *> *)customBubblingEventTypes
{
  return @[

    // Generic events
    @"press",
    @"change",
    @"focus",
    @"blur",
    @"submitEditing",
    @"endEditing",
    @"keyPress",

    // Touch events
    @"touchStart",
    @"touchMove",
    @"touchCancel",
    @"touchEnd",
  ];
}

- (ABI13_0_0RCTViewManagerUIBlock)uiBlockToAmendWithShadowView:(__unused ABI13_0_0RCTShadowView *)shadowView
{
  return nil;
}

- (ABI13_0_0RCTViewManagerUIBlock)uiBlockToAmendWithShadowViewRegistry:(__unused NSDictionary<NSNumber *, ABI13_0_0RCTShadowView *> *)shadowViewRegistry
{
  return nil;
}

#pragma mark - View properties

ABI13_0_0RCT_EXPORT_VIEW_PROPERTY(accessibilityLabel, NSString)
ABI13_0_0RCT_EXPORT_VIEW_PROPERTY(accessibilityTraits, UIAccessibilityTraits)
ABI13_0_0RCT_EXPORT_VIEW_PROPERTY(backgroundColor, UIColor)
ABI13_0_0RCT_REMAP_VIEW_PROPERTY(accessible, isAccessibilityElement, BOOL)
ABI13_0_0RCT_REMAP_VIEW_PROPERTY(testID, accessibilityIdentifier, NSString)
ABI13_0_0RCT_REMAP_VIEW_PROPERTY(backfaceVisibility, layer.doubleSided, css_backface_visibility_t)
ABI13_0_0RCT_REMAP_VIEW_PROPERTY(opacity, alpha, CGFloat)
ABI13_0_0RCT_REMAP_VIEW_PROPERTY(shadowColor, layer.shadowColor, CGColor)
ABI13_0_0RCT_REMAP_VIEW_PROPERTY(shadowOffset, layer.shadowOffset, CGSize)
ABI13_0_0RCT_REMAP_VIEW_PROPERTY(shadowOpacity, layer.shadowOpacity, float)
ABI13_0_0RCT_REMAP_VIEW_PROPERTY(shadowRadius, layer.shadowRadius, CGFloat)
ABI13_0_0RCT_CUSTOM_VIEW_PROPERTY(overflow, ABI13_0_0YGOverflow, ABI13_0_0RCTView)
{
  if (json) {
    view.clipsToBounds = [ABI13_0_0RCTConvert ABI13_0_0YGOverflow:json] != ABI13_0_0YGOverflowVisible;
  } else {
    view.clipsToBounds = defaultView.clipsToBounds;
  }
}
ABI13_0_0RCT_CUSTOM_VIEW_PROPERTY(shouldRasterizeIOS, BOOL, ABI13_0_0RCTView)
{
  view.layer.shouldRasterize = json ? [ABI13_0_0RCTConvert BOOL:json] : defaultView.layer.shouldRasterize;
  view.layer.rasterizationScale = view.layer.shouldRasterize ? [UIScreen mainScreen].scale : defaultView.layer.rasterizationScale;
}
// TODO: t11041683 Remove this duplicate property name.
ABI13_0_0RCT_CUSTOM_VIEW_PROPERTY(transformMatrix, CATransform3D, ABI13_0_0RCTView)
{
  view.layer.transform = json ? [ABI13_0_0RCTConvert CATransform3D:json] : defaultView.layer.transform;
  // TODO: Improve this by enabling edge antialiasing only for transforms with rotation or skewing
  view.layer.allowsEdgeAntialiasing = !CATransform3DIsIdentity(view.layer.transform);
}
ABI13_0_0RCT_CUSTOM_VIEW_PROPERTY(transform, CATransform3D, ABI13_0_0RCTView)
{
  view.layer.transform = json ? [ABI13_0_0RCTConvert CATransform3D:json] : defaultView.layer.transform;
  // TODO: Improve this by enabling edge antialiasing only for transforms with rotation or skewing
  view.layer.allowsEdgeAntialiasing = !CATransform3DIsIdentity(view.layer.transform);
}
ABI13_0_0RCT_CUSTOM_VIEW_PROPERTY(pointerEvents, ABI13_0_0RCTPointerEvents, ABI13_0_0RCTView)
{
  if ([view respondsToSelector:@selector(setPointerEvents:)]) {
    view.pointerEvents = json ? [ABI13_0_0RCTConvert ABI13_0_0RCTPointerEvents:json] : defaultView.pointerEvents;
    return;
  }

  if (!json) {
    view.userInteractionEnabled = defaultView.userInteractionEnabled;
    return;
  }

  switch ([ABI13_0_0RCTConvert ABI13_0_0RCTPointerEvents:json]) {
    case ABI13_0_0RCTPointerEventsUnspecified:
      // Pointer events "unspecified" acts as if a stylesheet had not specified,
      // which is different than "auto" in CSS (which cannot and will not be
      // supported in `ReactABI13_0_0`. "auto" may override a parent's "none".
      // Unspecified values do not.
      // This wouldn't override a container view's `userInteractionEnabled = NO`
      view.userInteractionEnabled = YES;
    case ABI13_0_0RCTPointerEventsNone:
      view.userInteractionEnabled = NO;
      break;
    default:
      ABI13_0_0RCTLogError(@"UIView base class does not support pointerEvent value: %@", json);
  }
}
ABI13_0_0RCT_CUSTOM_VIEW_PROPERTY(removeClippedSubviews, BOOL, ABI13_0_0RCTView)
{
  if ([view respondsToSelector:@selector(setRemoveClippedSubviews:)]) {
    view.removeClippedSubviews = json ? [ABI13_0_0RCTConvert BOOL:json] : defaultView.removeClippedSubviews;
  }
}
ABI13_0_0RCT_CUSTOM_VIEW_PROPERTY(borderRadius, CGFloat, ABI13_0_0RCTView) {
  if ([view respondsToSelector:@selector(setBorderRadius:)]) {
    view.borderRadius = json ? [ABI13_0_0RCTConvert CGFloat:json] : defaultView.borderRadius;
  } else {
    view.layer.cornerRadius = json ? [ABI13_0_0RCTConvert CGFloat:json] : defaultView.layer.cornerRadius;
  }
}
ABI13_0_0RCT_CUSTOM_VIEW_PROPERTY(borderColor, CGColor, ABI13_0_0RCTView)
{
  if ([view respondsToSelector:@selector(setBorderColor:)]) {
    view.borderColor = json ? [ABI13_0_0RCTConvert CGColor:json] : defaultView.borderColor;
  } else {
    view.layer.borderColor = json ? [ABI13_0_0RCTConvert CGColor:json] : defaultView.layer.borderColor;
  }
}
ABI13_0_0RCT_CUSTOM_VIEW_PROPERTY(borderWidth, float, ABI13_0_0RCTView)
{
  if ([view respondsToSelector:@selector(setBorderWidth:)]) {
    view.borderWidth = json ? [ABI13_0_0RCTConvert CGFloat:json] : defaultView.borderWidth;
  } else {
    view.layer.borderWidth = json ? [ABI13_0_0RCTConvert CGFloat:json] : defaultView.layer.borderWidth;
  }
}
ABI13_0_0RCT_CUSTOM_VIEW_PROPERTY(borderStyle, ABI13_0_0RCTBorderStyle, ABI13_0_0RCTView)
{
  if ([view respondsToSelector:@selector(setBorderStyle:)]) {
    view.borderStyle = json ? [ABI13_0_0RCTConvert ABI13_0_0RCTBorderStyle:json] : defaultView.borderStyle;
  }
}
ABI13_0_0RCT_CUSTOM_VIEW_PROPERTY(hitSlop, UIEdgeInsets, ABI13_0_0RCTView)
{
  if ([view respondsToSelector:@selector(setHitTestEdgeInsets:)]) {
    if (json) {
      UIEdgeInsets hitSlopInsets = [ABI13_0_0RCTConvert UIEdgeInsets:json];
      view.hitTestEdgeInsets = UIEdgeInsetsMake(-hitSlopInsets.top, -hitSlopInsets.left, -hitSlopInsets.bottom, -hitSlopInsets.right);
    } else {
      view.hitTestEdgeInsets = defaultView.hitTestEdgeInsets;
    }
  }
}
ABI13_0_0RCT_EXPORT_VIEW_PROPERTY(onAccessibilityTap, ABI13_0_0RCTDirectEventBlock)
ABI13_0_0RCT_EXPORT_VIEW_PROPERTY(onMagicTap, ABI13_0_0RCTDirectEventBlock)

#define ABI13_0_0RCT_VIEW_BORDER_PROPERTY(SIDE)                                  \
ABI13_0_0RCT_CUSTOM_VIEW_PROPERTY(border##SIDE##Width, float, ABI13_0_0RCTView)           \
{                                                                       \
  if ([view respondsToSelector:@selector(setBorder##SIDE##Width:)]) {   \
    view.border##SIDE##Width = json ? [ABI13_0_0RCTConvert CGFloat:json] : defaultView.border##SIDE##Width; \
  }                                                                     \
}                                                                       \
ABI13_0_0RCT_CUSTOM_VIEW_PROPERTY(border##SIDE##Color, UIColor, ABI13_0_0RCTView)         \
{                                                                       \
  if ([view respondsToSelector:@selector(setBorder##SIDE##Color:)]) {   \
    view.border##SIDE##Color = json ? [ABI13_0_0RCTConvert CGColor:json] : defaultView.border##SIDE##Color; \
  }                                                                     \
}

ABI13_0_0RCT_VIEW_BORDER_PROPERTY(Top)
ABI13_0_0RCT_VIEW_BORDER_PROPERTY(Right)
ABI13_0_0RCT_VIEW_BORDER_PROPERTY(Bottom)
ABI13_0_0RCT_VIEW_BORDER_PROPERTY(Left)

#define ABI13_0_0RCT_VIEW_BORDER_RADIUS_PROPERTY(SIDE)                           \
ABI13_0_0RCT_CUSTOM_VIEW_PROPERTY(border##SIDE##Radius, CGFloat, ABI13_0_0RCTView)        \
{                                                                       \
  if ([view respondsToSelector:@selector(setBorder##SIDE##Radius:)]) {  \
    view.border##SIDE##Radius = json ? [ABI13_0_0RCTConvert CGFloat:json] : defaultView.border##SIDE##Radius; \
  }                                                                     \
}                                                                       \

ABI13_0_0RCT_VIEW_BORDER_RADIUS_PROPERTY(TopLeft)
ABI13_0_0RCT_VIEW_BORDER_RADIUS_PROPERTY(TopRight)
ABI13_0_0RCT_VIEW_BORDER_RADIUS_PROPERTY(BottomLeft)
ABI13_0_0RCT_VIEW_BORDER_RADIUS_PROPERTY(BottomRight)

ABI13_0_0RCT_REMAP_VIEW_PROPERTY(zIndex, ReactABI13_0_0ZIndex, NSInteger)

#pragma mark - ShadowView properties

ABI13_0_0RCT_EXPORT_SHADOW_PROPERTY(backgroundColor, UIColor)

ABI13_0_0RCT_EXPORT_SHADOW_PROPERTY(top, float)
ABI13_0_0RCT_EXPORT_SHADOW_PROPERTY(right, float)
ABI13_0_0RCT_EXPORT_SHADOW_PROPERTY(bottom, float)
ABI13_0_0RCT_EXPORT_SHADOW_PROPERTY(left, float);

ABI13_0_0RCT_EXPORT_SHADOW_PROPERTY(width, float)
ABI13_0_0RCT_EXPORT_SHADOW_PROPERTY(height, float)

ABI13_0_0RCT_EXPORT_SHADOW_PROPERTY(minWidth, float)
ABI13_0_0RCT_EXPORT_SHADOW_PROPERTY(maxWidth, float)
ABI13_0_0RCT_EXPORT_SHADOW_PROPERTY(minHeight, float)
ABI13_0_0RCT_EXPORT_SHADOW_PROPERTY(maxHeight, float)

ABI13_0_0RCT_EXPORT_SHADOW_PROPERTY(borderTopWidth, float)
ABI13_0_0RCT_EXPORT_SHADOW_PROPERTY(borderRightWidth, float)
ABI13_0_0RCT_EXPORT_SHADOW_PROPERTY(borderBottomWidth, float)
ABI13_0_0RCT_EXPORT_SHADOW_PROPERTY(borderLeftWidth, float)
ABI13_0_0RCT_EXPORT_SHADOW_PROPERTY(borderWidth, float)

ABI13_0_0RCT_EXPORT_SHADOW_PROPERTY(marginTop, float)
ABI13_0_0RCT_EXPORT_SHADOW_PROPERTY(marginRight, float)
ABI13_0_0RCT_EXPORT_SHADOW_PROPERTY(marginBottom, float)
ABI13_0_0RCT_EXPORT_SHADOW_PROPERTY(marginLeft, float)
ABI13_0_0RCT_EXPORT_SHADOW_PROPERTY(marginVertical, float)
ABI13_0_0RCT_EXPORT_SHADOW_PROPERTY(marginHorizontal, float)
ABI13_0_0RCT_EXPORT_SHADOW_PROPERTY(margin, float)

ABI13_0_0RCT_EXPORT_SHADOW_PROPERTY(paddingTop, float)
ABI13_0_0RCT_EXPORT_SHADOW_PROPERTY(paddingRight, float)
ABI13_0_0RCT_EXPORT_SHADOW_PROPERTY(paddingBottom, float)
ABI13_0_0RCT_EXPORT_SHADOW_PROPERTY(paddingLeft, float)
ABI13_0_0RCT_EXPORT_SHADOW_PROPERTY(paddingVertical, float)
ABI13_0_0RCT_EXPORT_SHADOW_PROPERTY(paddingHorizontal, float)
ABI13_0_0RCT_EXPORT_SHADOW_PROPERTY(padding, float)

ABI13_0_0RCT_EXPORT_SHADOW_PROPERTY(flex, float)
ABI13_0_0RCT_EXPORT_SHADOW_PROPERTY(flexGrow, float)
ABI13_0_0RCT_EXPORT_SHADOW_PROPERTY(flexShrink, float)
ABI13_0_0RCT_EXPORT_SHADOW_PROPERTY(flexBasis, float)
ABI13_0_0RCT_EXPORT_SHADOW_PROPERTY(flexDirection, ABI13_0_0YGFlexDirection)
ABI13_0_0RCT_EXPORT_SHADOW_PROPERTY(flexWrap, ABI13_0_0YGWrap)
ABI13_0_0RCT_EXPORT_SHADOW_PROPERTY(justifyContent, ABI13_0_0YGJustify)
ABI13_0_0RCT_EXPORT_SHADOW_PROPERTY(alignItems, ABI13_0_0YGAlign)
ABI13_0_0RCT_EXPORT_SHADOW_PROPERTY(alignSelf, ABI13_0_0YGAlign)
ABI13_0_0RCT_EXPORT_SHADOW_PROPERTY(position, ABI13_0_0YGPositionType)
ABI13_0_0RCT_EXPORT_SHADOW_PROPERTY(aspectRatio, float)

ABI13_0_0RCT_EXPORT_SHADOW_PROPERTY(overflow, ABI13_0_0YGOverflow)

ABI13_0_0RCT_EXPORT_SHADOW_PROPERTY(onLayout, ABI13_0_0RCTDirectEventBlock)

ABI13_0_0RCT_EXPORT_SHADOW_PROPERTY(zIndex, NSInteger)

@end
