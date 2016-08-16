/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#import "ABI6_0_0RCTViewManager.h"

#import "ABI6_0_0RCTBridge.h"
#import "ABI6_0_0RCTBorderStyle.h"
#import "ABI6_0_0RCTConvert.h"
#import "ABI6_0_0RCTEventDispatcher.h"
#import "ABI6_0_0RCTLog.h"
#import "ABI6_0_0RCTShadowView.h"
#import "ABI6_0_0RCTUIManager.h"
#import "ABI6_0_0RCTUtils.h"
#import "ABI6_0_0RCTView.h"
#import "UIView+ReactABI6_0_0.h"

@implementation ABI6_0_0RCTConvert(UIAccessibilityTraits)

ABI6_0_0RCT_MULTI_ENUM_CONVERTER(UIAccessibilityTraits, (@{
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

@implementation ABI6_0_0RCTViewManager

@synthesize bridge = _bridge;

ABI6_0_0RCT_EXPORT_MODULE()

- (dispatch_queue_t)methodQueue
{
  return ABI6_0_0RCTGetUIManagerQueue();
}

- (UIView *)view
{
  return [ABI6_0_0RCTView new];
}

- (ABI6_0_0RCTShadowView *)shadowView
{
  return [ABI6_0_0RCTShadowView new];
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

- (NSArray<NSString *> *)customDirectEventTypes
{
  return @[];
}

- (NSDictionary<NSString *, id> *)constantsToExport
{
  return @{@"forceTouchAvailable": @(ABI6_0_0RCTForceTouchAvailable())};
}

- (ABI6_0_0RCTViewManagerUIBlock)uiBlockToAmendWithShadowView:(__unused ABI6_0_0RCTShadowView *)shadowView
{
  return nil;
}

- (ABI6_0_0RCTViewManagerUIBlock)uiBlockToAmendWithShadowViewRegistry:(__unused NSDictionary<NSNumber *, ABI6_0_0RCTShadowView *> *)shadowViewRegistry
{
  return nil;
}

#pragma mark - View properties

ABI6_0_0RCT_EXPORT_VIEW_PROPERTY(accessibilityLabel, NSString)
ABI6_0_0RCT_EXPORT_VIEW_PROPERTY(accessibilityTraits, UIAccessibilityTraits)
ABI6_0_0RCT_EXPORT_VIEW_PROPERTY(backgroundColor, UIColor)
ABI6_0_0RCT_REMAP_VIEW_PROPERTY(accessible, isAccessibilityElement, BOOL)
ABI6_0_0RCT_REMAP_VIEW_PROPERTY(testID, accessibilityIdentifier, NSString)
ABI6_0_0RCT_REMAP_VIEW_PROPERTY(backfaceVisibility, layer.doubleSided, css_backface_visibility_t)
ABI6_0_0RCT_REMAP_VIEW_PROPERTY(opacity, alpha, CGFloat)
ABI6_0_0RCT_REMAP_VIEW_PROPERTY(shadowColor, layer.shadowColor, CGColor);
ABI6_0_0RCT_REMAP_VIEW_PROPERTY(shadowOffset, layer.shadowOffset, CGSize);
ABI6_0_0RCT_REMAP_VIEW_PROPERTY(shadowOpacity, layer.shadowOpacity, float)
ABI6_0_0RCT_REMAP_VIEW_PROPERTY(shadowRadius, layer.shadowRadius, CGFloat)
ABI6_0_0RCT_REMAP_VIEW_PROPERTY(overflow, clipsToBounds, css_clip_t)
ABI6_0_0RCT_CUSTOM_VIEW_PROPERTY(shouldRasterizeIOS, BOOL, ABI6_0_0RCTView)
{
  view.layer.shouldRasterize = json ? [ABI6_0_0RCTConvert BOOL:json] : defaultView.layer.shouldRasterize;
  view.layer.rasterizationScale = view.layer.shouldRasterize ? [UIScreen mainScreen].scale : defaultView.layer.rasterizationScale;
}
// TODO: t11041683 Remove this duplicate property name.
ABI6_0_0RCT_CUSTOM_VIEW_PROPERTY(transformMatrix, CATransform3D, ABI6_0_0RCTView)
{
  view.layer.transform = json ? [ABI6_0_0RCTConvert CATransform3D:json] : defaultView.layer.transform;
  // TODO: Improve this by enabling edge antialiasing only for transforms with rotation or skewing
  view.layer.allowsEdgeAntialiasing = !CATransform3DIsIdentity(view.layer.transform);
}
ABI6_0_0RCT_CUSTOM_VIEW_PROPERTY(transform, CATransform3D, ABI6_0_0RCTView)
{
  view.layer.transform = json ? [ABI6_0_0RCTConvert CATransform3D:json] : defaultView.layer.transform;
  // TODO: Improve this by enabling edge antialiasing only for transforms with rotation or skewing
  view.layer.allowsEdgeAntialiasing = !CATransform3DIsIdentity(view.layer.transform);
}
ABI6_0_0RCT_CUSTOM_VIEW_PROPERTY(pointerEvents, ABI6_0_0RCTPointerEvents, ABI6_0_0RCTView)
{
  if ([view respondsToSelector:@selector(setPointerEvents:)]) {
    view.pointerEvents = json ? [ABI6_0_0RCTConvert ABI6_0_0RCTPointerEvents:json] : defaultView.pointerEvents;
    return;
  }

  if (!json) {
    view.userInteractionEnabled = defaultView.userInteractionEnabled;
    return;
  }

  switch ([ABI6_0_0RCTConvert ABI6_0_0RCTPointerEvents:json]) {
    case ABI6_0_0RCTPointerEventsUnspecified:
      // Pointer events "unspecified" acts as if a stylesheet had not specified,
      // which is different than "auto" in CSS (which cannot and will not be
      // supported in `ReactABI6_0_0`. "auto" may override a parent's "none".
      // Unspecified values do not.
      // This wouldn't override a container view's `userInteractionEnabled = NO`
      view.userInteractionEnabled = YES;
    case ABI6_0_0RCTPointerEventsNone:
      view.userInteractionEnabled = NO;
      break;
    default:
      ABI6_0_0RCTLogError(@"UIView base class does not support pointerEvent value: %@", json);
  }
}
ABI6_0_0RCT_CUSTOM_VIEW_PROPERTY(removeClippedSubviews, BOOL, ABI6_0_0RCTView)
{
  if ([view respondsToSelector:@selector(setRemoveClippedSubviews:)]) {
    view.removeClippedSubviews = json ? [ABI6_0_0RCTConvert BOOL:json] : defaultView.removeClippedSubviews;
  }
}
ABI6_0_0RCT_CUSTOM_VIEW_PROPERTY(borderRadius, CGFloat, ABI6_0_0RCTView) {
  if ([view respondsToSelector:@selector(setBorderRadius:)]) {
    view.borderRadius = json ? [ABI6_0_0RCTConvert CGFloat:json] : defaultView.borderRadius;
  } else {
    view.layer.cornerRadius = json ? [ABI6_0_0RCTConvert CGFloat:json] : defaultView.layer.cornerRadius;
  }
}
ABI6_0_0RCT_CUSTOM_VIEW_PROPERTY(borderColor, CGColor, ABI6_0_0RCTView)
{
  if ([view respondsToSelector:@selector(setBorderColor:)]) {
    view.borderColor = json ? [ABI6_0_0RCTConvert CGColor:json] : defaultView.borderColor;
  } else {
    view.layer.borderColor = json ? [ABI6_0_0RCTConvert CGColor:json] : defaultView.layer.borderColor;
  }
}
ABI6_0_0RCT_CUSTOM_VIEW_PROPERTY(borderWidth, CGFloat, ABI6_0_0RCTView)
{
  if ([view respondsToSelector:@selector(setBorderWidth:)]) {
    view.borderWidth = json ? [ABI6_0_0RCTConvert CGFloat:json] : defaultView.borderWidth;
  } else {
    view.layer.borderWidth = json ? [ABI6_0_0RCTConvert CGFloat:json] : defaultView.layer.borderWidth;
  }
}
ABI6_0_0RCT_CUSTOM_VIEW_PROPERTY(borderStyle, ABI6_0_0RCTBorderStyle, ABI6_0_0RCTView)
{
  if ([view respondsToSelector:@selector(setBorderStyle:)]) {
    view.borderStyle = json ? [ABI6_0_0RCTConvert ABI6_0_0RCTBorderStyle:json] : defaultView.borderStyle;
  }
}
ABI6_0_0RCT_CUSTOM_VIEW_PROPERTY(hitSlop, UIEdgeInsets, ABI6_0_0RCTView)
{
  if ([view respondsToSelector:@selector(setHitTestEdgeInsets:)]) {
    if (json) {
      UIEdgeInsets hitSlopInsets = [ABI6_0_0RCTConvert UIEdgeInsets:json];
      view.hitTestEdgeInsets = UIEdgeInsetsMake(-hitSlopInsets.top, -hitSlopInsets.left, -hitSlopInsets.bottom, -hitSlopInsets.right);
    } else {
      view.hitTestEdgeInsets = defaultView.hitTestEdgeInsets;
    }
  }
}
ABI6_0_0RCT_EXPORT_VIEW_PROPERTY(onAccessibilityTap, ABI6_0_0RCTDirectEventBlock)
ABI6_0_0RCT_EXPORT_VIEW_PROPERTY(onMagicTap, ABI6_0_0RCTDirectEventBlock)

#define ABI6_0_0RCT_VIEW_BORDER_PROPERTY(SIDE)                                  \
ABI6_0_0RCT_CUSTOM_VIEW_PROPERTY(border##SIDE##Width, CGFloat, ABI6_0_0RCTView)         \
{                                                                       \
  if ([view respondsToSelector:@selector(setBorder##SIDE##Width:)]) {   \
    view.border##SIDE##Width = json ? [ABI6_0_0RCTConvert CGFloat:json] : defaultView.border##SIDE##Width; \
  }                                                                     \
}                                                                       \
ABI6_0_0RCT_CUSTOM_VIEW_PROPERTY(border##SIDE##Color, UIColor, ABI6_0_0RCTView)         \
{                                                                       \
  if ([view respondsToSelector:@selector(setBorder##SIDE##Color:)]) {   \
    view.border##SIDE##Color = json ? [ABI6_0_0RCTConvert CGColor:json] : defaultView.border##SIDE##Color; \
  }                                                                     \
}

ABI6_0_0RCT_VIEW_BORDER_PROPERTY(Top)
ABI6_0_0RCT_VIEW_BORDER_PROPERTY(Right)
ABI6_0_0RCT_VIEW_BORDER_PROPERTY(Bottom)
ABI6_0_0RCT_VIEW_BORDER_PROPERTY(Left)

#define ABI6_0_0RCT_VIEW_BORDER_RADIUS_PROPERTY(SIDE)                           \
ABI6_0_0RCT_CUSTOM_VIEW_PROPERTY(border##SIDE##Radius, CGFloat, ABI6_0_0RCTView)        \
{                                                                       \
  if ([view respondsToSelector:@selector(setBorder##SIDE##Radius:)]) {  \
    view.border##SIDE##Radius = json ? [ABI6_0_0RCTConvert CGFloat:json] : defaultView.border##SIDE##Radius; \
  }                                                                     \
}                                                                       \

ABI6_0_0RCT_VIEW_BORDER_RADIUS_PROPERTY(TopLeft)
ABI6_0_0RCT_VIEW_BORDER_RADIUS_PROPERTY(TopRight)
ABI6_0_0RCT_VIEW_BORDER_RADIUS_PROPERTY(BottomLeft)
ABI6_0_0RCT_VIEW_BORDER_RADIUS_PROPERTY(BottomRight)

#pragma mark - ShadowView properties

ABI6_0_0RCT_EXPORT_SHADOW_PROPERTY(backgroundColor, UIColor)

ABI6_0_0RCT_EXPORT_SHADOW_PROPERTY(top, CGFloat)
ABI6_0_0RCT_EXPORT_SHADOW_PROPERTY(right, CGFloat)
ABI6_0_0RCT_EXPORT_SHADOW_PROPERTY(bottom, CGFloat)
ABI6_0_0RCT_EXPORT_SHADOW_PROPERTY(left, CGFloat);

ABI6_0_0RCT_EXPORT_SHADOW_PROPERTY(width, CGFloat)
ABI6_0_0RCT_EXPORT_SHADOW_PROPERTY(height, CGFloat)

ABI6_0_0RCT_EXPORT_SHADOW_PROPERTY(borderTopWidth, CGFloat)
ABI6_0_0RCT_EXPORT_SHADOW_PROPERTY(borderRightWidth, CGFloat)
ABI6_0_0RCT_EXPORT_SHADOW_PROPERTY(borderBottomWidth, CGFloat)
ABI6_0_0RCT_EXPORT_SHADOW_PROPERTY(borderLeftWidth, CGFloat)
ABI6_0_0RCT_EXPORT_SHADOW_PROPERTY(borderWidth, CGFloat)

ABI6_0_0RCT_EXPORT_SHADOW_PROPERTY(marginTop, CGFloat)
ABI6_0_0RCT_EXPORT_SHADOW_PROPERTY(marginRight, CGFloat)
ABI6_0_0RCT_EXPORT_SHADOW_PROPERTY(marginBottom, CGFloat)
ABI6_0_0RCT_EXPORT_SHADOW_PROPERTY(marginLeft, CGFloat)
ABI6_0_0RCT_EXPORT_SHADOW_PROPERTY(marginVertical, CGFloat)
ABI6_0_0RCT_EXPORT_SHADOW_PROPERTY(marginHorizontal, CGFloat)
ABI6_0_0RCT_EXPORT_SHADOW_PROPERTY(margin, CGFloat)

ABI6_0_0RCT_EXPORT_SHADOW_PROPERTY(paddingTop, CGFloat)
ABI6_0_0RCT_EXPORT_SHADOW_PROPERTY(paddingRight, CGFloat)
ABI6_0_0RCT_EXPORT_SHADOW_PROPERTY(paddingBottom, CGFloat)
ABI6_0_0RCT_EXPORT_SHADOW_PROPERTY(paddingLeft, CGFloat)
ABI6_0_0RCT_EXPORT_SHADOW_PROPERTY(paddingVertical, CGFloat)
ABI6_0_0RCT_EXPORT_SHADOW_PROPERTY(paddingHorizontal, CGFloat)
ABI6_0_0RCT_EXPORT_SHADOW_PROPERTY(padding, CGFloat)

ABI6_0_0RCT_EXPORT_SHADOW_PROPERTY(flex, CGFloat)
ABI6_0_0RCT_EXPORT_SHADOW_PROPERTY(flexDirection, css_flex_direction_t)
ABI6_0_0RCT_EXPORT_SHADOW_PROPERTY(flexWrap, css_wrap_type_t)
ABI6_0_0RCT_EXPORT_SHADOW_PROPERTY(justifyContent, css_justify_t)
ABI6_0_0RCT_EXPORT_SHADOW_PROPERTY(alignItems, css_align_t)
ABI6_0_0RCT_EXPORT_SHADOW_PROPERTY(alignSelf, css_align_t)
ABI6_0_0RCT_EXPORT_SHADOW_PROPERTY(position, css_position_type_t)

ABI6_0_0RCT_EXPORT_SHADOW_PROPERTY(onLayout, ABI6_0_0RCTDirectEventBlock)

@end
