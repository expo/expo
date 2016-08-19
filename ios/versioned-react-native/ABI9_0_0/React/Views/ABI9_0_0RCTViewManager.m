/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#import "ABI9_0_0RCTViewManager.h"

#import "ABI9_0_0RCTBridge.h"
#import "ABI9_0_0RCTBorderStyle.h"
#import "ABI9_0_0RCTConvert.h"
#import "ABI9_0_0RCTEventDispatcher.h"
#import "ABI9_0_0RCTLog.h"
#import "ABI9_0_0RCTShadowView.h"
#import "ABI9_0_0RCTUIManager.h"
#import "ABI9_0_0RCTUtils.h"
#import "ABI9_0_0RCTView.h"
#import "UIView+ReactABI9_0_0.h"

@implementation ABI9_0_0RCTConvert(UIAccessibilityTraits)

ABI9_0_0RCT_MULTI_ENUM_CONVERTER(UIAccessibilityTraits, (@{
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

@implementation ABI9_0_0RCTViewManager

@synthesize bridge = _bridge;

ABI9_0_0RCT_EXPORT_MODULE()

- (dispatch_queue_t)methodQueue
{
  return ABI9_0_0RCTGetUIManagerQueue();
}

- (UIView *)view
{
  return [ABI9_0_0RCTView new];
}

- (ABI9_0_0RCTShadowView *)shadowView
{
  return [ABI9_0_0RCTShadowView new];
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
  return @{@"forceTouchAvailable": @(ABI9_0_0RCTForceTouchAvailable())};
}

- (ABI9_0_0RCTViewManagerUIBlock)uiBlockToAmendWithShadowView:(__unused ABI9_0_0RCTShadowView *)shadowView
{
  return nil;
}

- (ABI9_0_0RCTViewManagerUIBlock)uiBlockToAmendWithShadowViewRegistry:(__unused NSDictionary<NSNumber *, ABI9_0_0RCTShadowView *> *)shadowViewRegistry
{
  return nil;
}

#pragma mark - View properties

ABI9_0_0RCT_EXPORT_VIEW_PROPERTY(accessibilityLabel, NSString)
ABI9_0_0RCT_EXPORT_VIEW_PROPERTY(accessibilityTraits, UIAccessibilityTraits)
ABI9_0_0RCT_EXPORT_VIEW_PROPERTY(backgroundColor, UIColor)
ABI9_0_0RCT_REMAP_VIEW_PROPERTY(accessible, isAccessibilityElement, BOOL)
ABI9_0_0RCT_REMAP_VIEW_PROPERTY(testID, accessibilityIdentifier, NSString)
ABI9_0_0RCT_REMAP_VIEW_PROPERTY(backfaceVisibility, layer.doubleSided, css_backface_visibility_t)
ABI9_0_0RCT_REMAP_VIEW_PROPERTY(opacity, alpha, CGFloat)
ABI9_0_0RCT_REMAP_VIEW_PROPERTY(shadowColor, layer.shadowColor, CGColor)
ABI9_0_0RCT_REMAP_VIEW_PROPERTY(shadowOffset, layer.shadowOffset, CGSize)
ABI9_0_0RCT_REMAP_VIEW_PROPERTY(shadowOpacity, layer.shadowOpacity, float)
ABI9_0_0RCT_REMAP_VIEW_PROPERTY(shadowRadius, layer.shadowRadius, CGFloat)
ABI9_0_0RCT_REMAP_VIEW_PROPERTY(overflow, clipsToBounds, css_clip_t)
ABI9_0_0RCT_CUSTOM_VIEW_PROPERTY(shouldRasterizeIOS, BOOL, ABI9_0_0RCTView)
{
  view.layer.shouldRasterize = json ? [ABI9_0_0RCTConvert BOOL:json] : defaultView.layer.shouldRasterize;
  view.layer.rasterizationScale = view.layer.shouldRasterize ? [UIScreen mainScreen].scale : defaultView.layer.rasterizationScale;
}
// TODO: t11041683 Remove this duplicate property name.
ABI9_0_0RCT_CUSTOM_VIEW_PROPERTY(transformMatrix, CATransform3D, ABI9_0_0RCTView)
{
  view.layer.transform = json ? [ABI9_0_0RCTConvert CATransform3D:json] : defaultView.layer.transform;
  // TODO: Improve this by enabling edge antialiasing only for transforms with rotation or skewing
  view.layer.allowsEdgeAntialiasing = !CATransform3DIsIdentity(view.layer.transform);
}
ABI9_0_0RCT_CUSTOM_VIEW_PROPERTY(transform, CATransform3D, ABI9_0_0RCTView)
{
  view.layer.transform = json ? [ABI9_0_0RCTConvert CATransform3D:json] : defaultView.layer.transform;
  // TODO: Improve this by enabling edge antialiasing only for transforms with rotation or skewing
  view.layer.allowsEdgeAntialiasing = !CATransform3DIsIdentity(view.layer.transform);
}
ABI9_0_0RCT_CUSTOM_VIEW_PROPERTY(pointerEvents, ABI9_0_0RCTPointerEvents, ABI9_0_0RCTView)
{
  if ([view respondsToSelector:@selector(setPointerEvents:)]) {
    view.pointerEvents = json ? [ABI9_0_0RCTConvert ABI9_0_0RCTPointerEvents:json] : defaultView.pointerEvents;
    return;
  }

  if (!json) {
    view.userInteractionEnabled = defaultView.userInteractionEnabled;
    return;
  }

  switch ([ABI9_0_0RCTConvert ABI9_0_0RCTPointerEvents:json]) {
    case ABI9_0_0RCTPointerEventsUnspecified:
      // Pointer events "unspecified" acts as if a stylesheet had not specified,
      // which is different than "auto" in ABI9_0_0CSS (which cannot and will not be
      // supported in `ReactABI9_0_0`. "auto" may override a parent's "none".
      // Unspecified values do not.
      // This wouldn't override a container view's `userInteractionEnabled = NO`
      view.userInteractionEnabled = YES;
    case ABI9_0_0RCTPointerEventsNone:
      view.userInteractionEnabled = NO;
      break;
    default:
      ABI9_0_0RCTLogError(@"UIView base class does not support pointerEvent value: %@", json);
  }
}
ABI9_0_0RCT_CUSTOM_VIEW_PROPERTY(removeClippedSubviews, BOOL, ABI9_0_0RCTView)
{
  if ([view respondsToSelector:@selector(setRemoveClippedSubviews:)]) {
    view.removeClippedSubviews = json ? [ABI9_0_0RCTConvert BOOL:json] : defaultView.removeClippedSubviews;
  }
}
ABI9_0_0RCT_CUSTOM_VIEW_PROPERTY(borderRadius, CGFloat, ABI9_0_0RCTView) {
  if ([view respondsToSelector:@selector(setBorderRadius:)]) {
    view.borderRadius = json ? [ABI9_0_0RCTConvert CGFloat:json] : defaultView.borderRadius;
  } else {
    view.layer.cornerRadius = json ? [ABI9_0_0RCTConvert CGFloat:json] : defaultView.layer.cornerRadius;
  }
}
ABI9_0_0RCT_CUSTOM_VIEW_PROPERTY(borderColor, CGColor, ABI9_0_0RCTView)
{
  if ([view respondsToSelector:@selector(setBorderColor:)]) {
    view.borderColor = json ? [ABI9_0_0RCTConvert CGColor:json] : defaultView.borderColor;
  } else {
    view.layer.borderColor = json ? [ABI9_0_0RCTConvert CGColor:json] : defaultView.layer.borderColor;
  }
}
ABI9_0_0RCT_CUSTOM_VIEW_PROPERTY(borderWidth, CGFloat, ABI9_0_0RCTView)
{
  if ([view respondsToSelector:@selector(setBorderWidth:)]) {
    view.borderWidth = json ? [ABI9_0_0RCTConvert CGFloat:json] : defaultView.borderWidth;
  } else {
    view.layer.borderWidth = json ? [ABI9_0_0RCTConvert CGFloat:json] : defaultView.layer.borderWidth;
  }
}
ABI9_0_0RCT_CUSTOM_VIEW_PROPERTY(borderStyle, ABI9_0_0RCTBorderStyle, ABI9_0_0RCTView)
{
  if ([view respondsToSelector:@selector(setBorderStyle:)]) {
    view.borderStyle = json ? [ABI9_0_0RCTConvert ABI9_0_0RCTBorderStyle:json] : defaultView.borderStyle;
  }
}
ABI9_0_0RCT_CUSTOM_VIEW_PROPERTY(hitSlop, UIEdgeInsets, ABI9_0_0RCTView)
{
  if ([view respondsToSelector:@selector(setHitTestEdgeInsets:)]) {
    if (json) {
      UIEdgeInsets hitSlopInsets = [ABI9_0_0RCTConvert UIEdgeInsets:json];
      view.hitTestEdgeInsets = UIEdgeInsetsMake(-hitSlopInsets.top, -hitSlopInsets.left, -hitSlopInsets.bottom, -hitSlopInsets.right);
    } else {
      view.hitTestEdgeInsets = defaultView.hitTestEdgeInsets;
    }
  }
}
ABI9_0_0RCT_EXPORT_VIEW_PROPERTY(onAccessibilityTap, ABI9_0_0RCTDirectEventBlock)
ABI9_0_0RCT_EXPORT_VIEW_PROPERTY(onMagicTap, ABI9_0_0RCTDirectEventBlock)

#define ABI9_0_0RCT_VIEW_BORDER_PROPERTY(SIDE)                                  \
ABI9_0_0RCT_CUSTOM_VIEW_PROPERTY(border##SIDE##Width, CGFloat, ABI9_0_0RCTView)         \
{                                                                       \
  if ([view respondsToSelector:@selector(setBorder##SIDE##Width:)]) {   \
    view.border##SIDE##Width = json ? [ABI9_0_0RCTConvert CGFloat:json] : defaultView.border##SIDE##Width; \
  }                                                                     \
}                                                                       \
ABI9_0_0RCT_CUSTOM_VIEW_PROPERTY(border##SIDE##Color, UIColor, ABI9_0_0RCTView)         \
{                                                                       \
  if ([view respondsToSelector:@selector(setBorder##SIDE##Color:)]) {   \
    view.border##SIDE##Color = json ? [ABI9_0_0RCTConvert CGColor:json] : defaultView.border##SIDE##Color; \
  }                                                                     \
}

ABI9_0_0RCT_VIEW_BORDER_PROPERTY(Top)
ABI9_0_0RCT_VIEW_BORDER_PROPERTY(Right)
ABI9_0_0RCT_VIEW_BORDER_PROPERTY(Bottom)
ABI9_0_0RCT_VIEW_BORDER_PROPERTY(Left)

#define ABI9_0_0RCT_VIEW_BORDER_RADIUS_PROPERTY(SIDE)                           \
ABI9_0_0RCT_CUSTOM_VIEW_PROPERTY(border##SIDE##Radius, CGFloat, ABI9_0_0RCTView)        \
{                                                                       \
  if ([view respondsToSelector:@selector(setBorder##SIDE##Radius:)]) {  \
    view.border##SIDE##Radius = json ? [ABI9_0_0RCTConvert CGFloat:json] : defaultView.border##SIDE##Radius; \
  }                                                                     \
}                                                                       \

ABI9_0_0RCT_VIEW_BORDER_RADIUS_PROPERTY(TopLeft)
ABI9_0_0RCT_VIEW_BORDER_RADIUS_PROPERTY(TopRight)
ABI9_0_0RCT_VIEW_BORDER_RADIUS_PROPERTY(BottomLeft)
ABI9_0_0RCT_VIEW_BORDER_RADIUS_PROPERTY(BottomRight)

ABI9_0_0RCT_REMAP_VIEW_PROPERTY(zIndex, ReactABI9_0_0ZIndex, NSInteger)

#pragma mark - ShadowView properties

ABI9_0_0RCT_EXPORT_SHADOW_PROPERTY(backgroundColor, UIColor)

ABI9_0_0RCT_EXPORT_SHADOW_PROPERTY(top, CGFloat)
ABI9_0_0RCT_EXPORT_SHADOW_PROPERTY(right, CGFloat)
ABI9_0_0RCT_EXPORT_SHADOW_PROPERTY(bottom, CGFloat)
ABI9_0_0RCT_EXPORT_SHADOW_PROPERTY(left, CGFloat);

ABI9_0_0RCT_EXPORT_SHADOW_PROPERTY(width, CGFloat)
ABI9_0_0RCT_EXPORT_SHADOW_PROPERTY(height, CGFloat)

ABI9_0_0RCT_EXPORT_SHADOW_PROPERTY(minWidth, CGFloat)
ABI9_0_0RCT_EXPORT_SHADOW_PROPERTY(maxWidth, CGFloat)
ABI9_0_0RCT_EXPORT_SHADOW_PROPERTY(minHeight, CGFloat)
ABI9_0_0RCT_EXPORT_SHADOW_PROPERTY(maxHeight, CGFloat)

ABI9_0_0RCT_EXPORT_SHADOW_PROPERTY(borderTopWidth, CGFloat)
ABI9_0_0RCT_EXPORT_SHADOW_PROPERTY(borderRightWidth, CGFloat)
ABI9_0_0RCT_EXPORT_SHADOW_PROPERTY(borderBottomWidth, CGFloat)
ABI9_0_0RCT_EXPORT_SHADOW_PROPERTY(borderLeftWidth, CGFloat)
ABI9_0_0RCT_EXPORT_SHADOW_PROPERTY(borderWidth, CGFloat)

ABI9_0_0RCT_EXPORT_SHADOW_PROPERTY(marginTop, CGFloat)
ABI9_0_0RCT_EXPORT_SHADOW_PROPERTY(marginRight, CGFloat)
ABI9_0_0RCT_EXPORT_SHADOW_PROPERTY(marginBottom, CGFloat)
ABI9_0_0RCT_EXPORT_SHADOW_PROPERTY(marginLeft, CGFloat)
ABI9_0_0RCT_EXPORT_SHADOW_PROPERTY(marginVertical, CGFloat)
ABI9_0_0RCT_EXPORT_SHADOW_PROPERTY(marginHorizontal, CGFloat)
ABI9_0_0RCT_EXPORT_SHADOW_PROPERTY(margin, CGFloat)

ABI9_0_0RCT_EXPORT_SHADOW_PROPERTY(paddingTop, CGFloat)
ABI9_0_0RCT_EXPORT_SHADOW_PROPERTY(paddingRight, CGFloat)
ABI9_0_0RCT_EXPORT_SHADOW_PROPERTY(paddingBottom, CGFloat)
ABI9_0_0RCT_EXPORT_SHADOW_PROPERTY(paddingLeft, CGFloat)
ABI9_0_0RCT_EXPORT_SHADOW_PROPERTY(paddingVertical, CGFloat)
ABI9_0_0RCT_EXPORT_SHADOW_PROPERTY(paddingHorizontal, CGFloat)
ABI9_0_0RCT_EXPORT_SHADOW_PROPERTY(padding, CGFloat)

ABI9_0_0RCT_EXPORT_SHADOW_PROPERTY(flex, CGFloat)
ABI9_0_0RCT_EXPORT_SHADOW_PROPERTY(flexDirection, ABI9_0_0CSSFlexDirection)
ABI9_0_0RCT_EXPORT_SHADOW_PROPERTY(flexWrap, ABI9_0_0CSSWrapType)
ABI9_0_0RCT_EXPORT_SHADOW_PROPERTY(justifyContent, ABI9_0_0CSSJustify)
ABI9_0_0RCT_EXPORT_SHADOW_PROPERTY(alignItems, ABI9_0_0CSSAlign)
ABI9_0_0RCT_EXPORT_SHADOW_PROPERTY(alignSelf, ABI9_0_0CSSAlign)
ABI9_0_0RCT_EXPORT_SHADOW_PROPERTY(position, ABI9_0_0CSSPositionType)

ABI9_0_0RCT_EXPORT_SHADOW_PROPERTY(onLayout, ABI9_0_0RCTDirectEventBlock)

ABI9_0_0RCT_EXPORT_SHADOW_PROPERTY(zIndex, NSInteger)

@end
