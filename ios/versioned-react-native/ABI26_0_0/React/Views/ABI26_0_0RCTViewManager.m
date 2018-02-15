/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#import "ABI26_0_0RCTViewManager.h"

#import "ABI26_0_0RCTBorderStyle.h"
#import "ABI26_0_0RCTBridge.h"
#import "ABI26_0_0RCTConvert.h"
#import "ABI26_0_0RCTEventDispatcher.h"
#import "ABI26_0_0RCTLog.h"
#import "ABI26_0_0RCTShadowView.h"
#import "ABI26_0_0RCTUIManager.h"
#import "ABI26_0_0RCTUIManagerUtils.h"
#import "ABI26_0_0RCTUtils.h"
#import "ABI26_0_0RCTView.h"
#import "UIView+ReactABI26_0_0.h"
#import "ABI26_0_0RCTConvert+Transform.h"

#if TARGET_OS_TV
#import "ABI26_0_0RCTTVView.h"
#endif

@implementation ABI26_0_0RCTConvert(UIAccessibilityTraits)

ABI26_0_0RCT_MULTI_ENUM_CONVERTER(UIAccessibilityTraits, (@{
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

@implementation ABI26_0_0RCTViewManager

@synthesize bridge = _bridge;

ABI26_0_0RCT_EXPORT_MODULE()

- (dispatch_queue_t)methodQueue
{
  return ABI26_0_0RCTGetUIManagerQueue();
}

- (UIView *)view
{
#if TARGET_OS_TV
  return [ABI26_0_0RCTTVView new];
#else
  return [ABI26_0_0RCTView new];
#endif
}

- (ABI26_0_0RCTShadowView *)shadowView
{
  return [ABI26_0_0RCTShadowView new];
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

- (ABI26_0_0RCTViewManagerUIBlock)uiBlockToAmendWithShadowView:(__unused ABI26_0_0RCTShadowView *)shadowView
{
  return nil;
}

- (ABI26_0_0RCTViewManagerUIBlock)uiBlockToAmendWithShadowViewRegistry:(__unused NSDictionary<NSNumber *, ABI26_0_0RCTShadowView *> *)shadowViewRegistry
{
  return nil;
}

#pragma mark - View properties

#if TARGET_OS_TV
// Apple TV properties
ABI26_0_0RCT_EXPORT_VIEW_PROPERTY(isTVSelectable, BOOL)
ABI26_0_0RCT_EXPORT_VIEW_PROPERTY(hasTVPreferredFocus, BOOL)
ABI26_0_0RCT_EXPORT_VIEW_PROPERTY(tvParallaxProperties, NSDictionary)
#endif

ABI26_0_0RCT_EXPORT_VIEW_PROPERTY(nativeID, NSString)

// Acessibility related properties
ABI26_0_0RCT_REMAP_VIEW_PROPERTY(accessible, ReactABI26_0_0AccessibilityElement.isAccessibilityElement, BOOL)
ABI26_0_0RCT_REMAP_VIEW_PROPERTY(accessibilityActions, ReactABI26_0_0AccessibilityElement.accessibilityActions, NSString)
ABI26_0_0RCT_REMAP_VIEW_PROPERTY(accessibilityLabel, ReactABI26_0_0AccessibilityElement.accessibilityLabel, NSString)
ABI26_0_0RCT_REMAP_VIEW_PROPERTY(accessibilityTraits, ReactABI26_0_0AccessibilityElement.accessibilityTraits, UIAccessibilityTraits)
ABI26_0_0RCT_REMAP_VIEW_PROPERTY(accessibilityViewIsModal, ReactABI26_0_0AccessibilityElement.accessibilityViewIsModal, BOOL)
ABI26_0_0RCT_REMAP_VIEW_PROPERTY(onAccessibilityAction, ReactABI26_0_0AccessibilityElement.onAccessibilityAction, ABI26_0_0RCTDirectEventBlock)
ABI26_0_0RCT_REMAP_VIEW_PROPERTY(onAccessibilityTap, ReactABI26_0_0AccessibilityElement.onAccessibilityTap, ABI26_0_0RCTDirectEventBlock)
ABI26_0_0RCT_REMAP_VIEW_PROPERTY(onMagicTap, ReactABI26_0_0AccessibilityElement.onMagicTap, ABI26_0_0RCTDirectEventBlock)
ABI26_0_0RCT_REMAP_VIEW_PROPERTY(testID, ReactABI26_0_0AccessibilityElement.accessibilityIdentifier, NSString)

ABI26_0_0RCT_EXPORT_VIEW_PROPERTY(backgroundColor, UIColor)
ABI26_0_0RCT_REMAP_VIEW_PROPERTY(backfaceVisibility, layer.doubleSided, css_backface_visibility_t)
ABI26_0_0RCT_REMAP_VIEW_PROPERTY(opacity, alpha, CGFloat)
ABI26_0_0RCT_REMAP_VIEW_PROPERTY(shadowColor, layer.shadowColor, CGColor)
ABI26_0_0RCT_REMAP_VIEW_PROPERTY(shadowOffset, layer.shadowOffset, CGSize)
ABI26_0_0RCT_REMAP_VIEW_PROPERTY(shadowOpacity, layer.shadowOpacity, float)
ABI26_0_0RCT_REMAP_VIEW_PROPERTY(shadowRadius, layer.shadowRadius, CGFloat)
ABI26_0_0RCT_CUSTOM_VIEW_PROPERTY(overflow, ABI26_0_0YGOverflow, ABI26_0_0RCTView)
{
  if (json) {
    view.clipsToBounds = [ABI26_0_0RCTConvert ABI26_0_0YGOverflow:json] != ABI26_0_0YGOverflowVisible;
  } else {
    view.clipsToBounds = defaultView.clipsToBounds;
  }
}
ABI26_0_0RCT_CUSTOM_VIEW_PROPERTY(shouldRasterizeIOS, BOOL, ABI26_0_0RCTView)
{
  view.layer.shouldRasterize = json ? [ABI26_0_0RCTConvert BOOL:json] : defaultView.layer.shouldRasterize;
  view.layer.rasterizationScale = view.layer.shouldRasterize ? [UIScreen mainScreen].scale : defaultView.layer.rasterizationScale;
}

ABI26_0_0RCT_CUSTOM_VIEW_PROPERTY(transform, CATransform3D, ABI26_0_0RCTView)
{
  view.layer.transform = json ? [ABI26_0_0RCTConvert CATransform3D:json] : defaultView.layer.transform;
  // TODO: Improve this by enabling edge antialiasing only for transforms with rotation or skewing
  view.layer.allowsEdgeAntialiasing = !CATransform3DIsIdentity(view.layer.transform);
}

ABI26_0_0RCT_CUSTOM_VIEW_PROPERTY(pointerEvents, ABI26_0_0RCTPointerEvents, ABI26_0_0RCTView)
{
  if ([view respondsToSelector:@selector(setPointerEvents:)]) {
    view.pointerEvents = json ? [ABI26_0_0RCTConvert ABI26_0_0RCTPointerEvents:json] : defaultView.pointerEvents;
    return;
  }

  if (!json) {
    view.userInteractionEnabled = defaultView.userInteractionEnabled;
    return;
  }

  switch ([ABI26_0_0RCTConvert ABI26_0_0RCTPointerEvents:json]) {
    case ABI26_0_0RCTPointerEventsUnspecified:
      // Pointer events "unspecified" acts as if a stylesheet had not specified,
      // which is different than "auto" in CSS (which cannot and will not be
      // supported in `ReactABI26_0_0`. "auto" may override a parent's "none".
      // Unspecified values do not.
      // This wouldn't override a container view's `userInteractionEnabled = NO`
      view.userInteractionEnabled = YES;
    case ABI26_0_0RCTPointerEventsNone:
      view.userInteractionEnabled = NO;
      break;
    default:
      ABI26_0_0RCTLogError(@"UIView base class does not support pointerEvent value: %@", json);
  }
}
ABI26_0_0RCT_CUSTOM_VIEW_PROPERTY(removeClippedSubviews, BOOL, ABI26_0_0RCTView)
{
  if ([view respondsToSelector:@selector(setRemoveClippedSubviews:)]) {
    view.removeClippedSubviews = json ? [ABI26_0_0RCTConvert BOOL:json] : defaultView.removeClippedSubviews;
  }
}
ABI26_0_0RCT_CUSTOM_VIEW_PROPERTY(borderRadius, CGFloat, ABI26_0_0RCTView) {
  if ([view respondsToSelector:@selector(setBorderRadius:)]) {
    view.borderRadius = json ? [ABI26_0_0RCTConvert CGFloat:json] : defaultView.borderRadius;
  } else {
    view.layer.cornerRadius = json ? [ABI26_0_0RCTConvert CGFloat:json] : defaultView.layer.cornerRadius;
  }
}
ABI26_0_0RCT_CUSTOM_VIEW_PROPERTY(borderColor, CGColor, ABI26_0_0RCTView)
{
  if ([view respondsToSelector:@selector(setBorderColor:)]) {
    view.borderColor = json ? [ABI26_0_0RCTConvert CGColor:json] : defaultView.borderColor;
  } else {
    view.layer.borderColor = json ? [ABI26_0_0RCTConvert CGColor:json] : defaultView.layer.borderColor;
  }
}
ABI26_0_0RCT_CUSTOM_VIEW_PROPERTY(borderWidth, float, ABI26_0_0RCTView)
{
  if ([view respondsToSelector:@selector(setBorderWidth:)]) {
    view.borderWidth = json ? [ABI26_0_0RCTConvert CGFloat:json] : defaultView.borderWidth;
  } else {
    view.layer.borderWidth = json ? [ABI26_0_0RCTConvert CGFloat:json] : defaultView.layer.borderWidth;
  }
}
ABI26_0_0RCT_CUSTOM_VIEW_PROPERTY(borderStyle, ABI26_0_0RCTBorderStyle, ABI26_0_0RCTView)
{
  if ([view respondsToSelector:@selector(setBorderStyle:)]) {
    view.borderStyle = json ? [ABI26_0_0RCTConvert ABI26_0_0RCTBorderStyle:json] : defaultView.borderStyle;
  }
}
ABI26_0_0RCT_CUSTOM_VIEW_PROPERTY(hitSlop, UIEdgeInsets, ABI26_0_0RCTView)
{
  if ([view respondsToSelector:@selector(setHitTestEdgeInsets:)]) {
    if (json) {
      UIEdgeInsets hitSlopInsets = [ABI26_0_0RCTConvert UIEdgeInsets:json];
      view.hitTestEdgeInsets = UIEdgeInsetsMake(-hitSlopInsets.top, -hitSlopInsets.left, -hitSlopInsets.bottom, -hitSlopInsets.right);
    } else {
      view.hitTestEdgeInsets = defaultView.hitTestEdgeInsets;
    }
  }
}

#define ABI26_0_0RCT_VIEW_BORDER_PROPERTY(SIDE)                                  \
ABI26_0_0RCT_CUSTOM_VIEW_PROPERTY(border##SIDE##Width, float, ABI26_0_0RCTView)           \
{                                                                       \
  if ([view respondsToSelector:@selector(setBorder##SIDE##Width:)]) {   \
    view.border##SIDE##Width = json ? [ABI26_0_0RCTConvert CGFloat:json] : defaultView.border##SIDE##Width; \
  }                                                                     \
}                                                                       \
ABI26_0_0RCT_CUSTOM_VIEW_PROPERTY(border##SIDE##Color, UIColor, ABI26_0_0RCTView)         \
{                                                                       \
  if ([view respondsToSelector:@selector(setBorder##SIDE##Color:)]) {   \
    view.border##SIDE##Color = json ? [ABI26_0_0RCTConvert CGColor:json] : defaultView.border##SIDE##Color; \
  }                                                                     \
}

ABI26_0_0RCT_VIEW_BORDER_PROPERTY(Top)
ABI26_0_0RCT_VIEW_BORDER_PROPERTY(Right)
ABI26_0_0RCT_VIEW_BORDER_PROPERTY(Bottom)
ABI26_0_0RCT_VIEW_BORDER_PROPERTY(Left)
ABI26_0_0RCT_VIEW_BORDER_PROPERTY(Start)
ABI26_0_0RCT_VIEW_BORDER_PROPERTY(End)

#define ABI26_0_0RCT_VIEW_BORDER_RADIUS_PROPERTY(SIDE)                           \
ABI26_0_0RCT_CUSTOM_VIEW_PROPERTY(border##SIDE##Radius, CGFloat, ABI26_0_0RCTView)        \
{                                                                       \
  if ([view respondsToSelector:@selector(setBorder##SIDE##Radius:)]) {  \
    view.border##SIDE##Radius = json ? [ABI26_0_0RCTConvert CGFloat:json] : defaultView.border##SIDE##Radius; \
  }                                                                     \
}                                                                       \

ABI26_0_0RCT_VIEW_BORDER_RADIUS_PROPERTY(TopLeft)
ABI26_0_0RCT_VIEW_BORDER_RADIUS_PROPERTY(TopRight)
ABI26_0_0RCT_VIEW_BORDER_RADIUS_PROPERTY(TopStart)
ABI26_0_0RCT_VIEW_BORDER_RADIUS_PROPERTY(TopEnd)
ABI26_0_0RCT_VIEW_BORDER_RADIUS_PROPERTY(BottomLeft)
ABI26_0_0RCT_VIEW_BORDER_RADIUS_PROPERTY(BottomRight)
ABI26_0_0RCT_VIEW_BORDER_RADIUS_PROPERTY(BottomStart)
ABI26_0_0RCT_VIEW_BORDER_RADIUS_PROPERTY(BottomEnd)

ABI26_0_0RCT_REMAP_VIEW_PROPERTY(display, ReactABI26_0_0Display, ABI26_0_0YGDisplay)
ABI26_0_0RCT_REMAP_VIEW_PROPERTY(zIndex, ReactABI26_0_0ZIndex, NSInteger)

#pragma mark - ShadowView properties

ABI26_0_0RCT_EXPORT_SHADOW_PROPERTY(top, ABI26_0_0YGValue)
ABI26_0_0RCT_EXPORT_SHADOW_PROPERTY(right, ABI26_0_0YGValue)
ABI26_0_0RCT_EXPORT_SHADOW_PROPERTY(start, ABI26_0_0YGValue)
ABI26_0_0RCT_EXPORT_SHADOW_PROPERTY(end, ABI26_0_0YGValue)
ABI26_0_0RCT_EXPORT_SHADOW_PROPERTY(bottom, ABI26_0_0YGValue)
ABI26_0_0RCT_EXPORT_SHADOW_PROPERTY(left, ABI26_0_0YGValue)

ABI26_0_0RCT_EXPORT_SHADOW_PROPERTY(width, ABI26_0_0YGValue)
ABI26_0_0RCT_EXPORT_SHADOW_PROPERTY(height, ABI26_0_0YGValue)

ABI26_0_0RCT_EXPORT_SHADOW_PROPERTY(minWidth, ABI26_0_0YGValue)
ABI26_0_0RCT_EXPORT_SHADOW_PROPERTY(maxWidth, ABI26_0_0YGValue)
ABI26_0_0RCT_EXPORT_SHADOW_PROPERTY(minHeight, ABI26_0_0YGValue)
ABI26_0_0RCT_EXPORT_SHADOW_PROPERTY(maxHeight, ABI26_0_0YGValue)

ABI26_0_0RCT_EXPORT_SHADOW_PROPERTY(borderTopWidth, float)
ABI26_0_0RCT_EXPORT_SHADOW_PROPERTY(borderRightWidth, float)
ABI26_0_0RCT_EXPORT_SHADOW_PROPERTY(borderBottomWidth, float)
ABI26_0_0RCT_EXPORT_SHADOW_PROPERTY(borderLeftWidth, float)
ABI26_0_0RCT_EXPORT_SHADOW_PROPERTY(borderStartWidth, float)
ABI26_0_0RCT_EXPORT_SHADOW_PROPERTY(borderEndWidth, float)
ABI26_0_0RCT_EXPORT_SHADOW_PROPERTY(borderWidth, float)

ABI26_0_0RCT_EXPORT_SHADOW_PROPERTY(marginTop, ABI26_0_0YGValue)
ABI26_0_0RCT_EXPORT_SHADOW_PROPERTY(marginRight, ABI26_0_0YGValue)
ABI26_0_0RCT_EXPORT_SHADOW_PROPERTY(marginBottom, ABI26_0_0YGValue)
ABI26_0_0RCT_EXPORT_SHADOW_PROPERTY(marginLeft, ABI26_0_0YGValue)
ABI26_0_0RCT_EXPORT_SHADOW_PROPERTY(marginStart, ABI26_0_0YGValue)
ABI26_0_0RCT_EXPORT_SHADOW_PROPERTY(marginEnd, ABI26_0_0YGValue)
ABI26_0_0RCT_EXPORT_SHADOW_PROPERTY(marginVertical, ABI26_0_0YGValue)
ABI26_0_0RCT_EXPORT_SHADOW_PROPERTY(marginHorizontal, ABI26_0_0YGValue)
ABI26_0_0RCT_EXPORT_SHADOW_PROPERTY(margin, ABI26_0_0YGValue)

ABI26_0_0RCT_EXPORT_SHADOW_PROPERTY(paddingTop, ABI26_0_0YGValue)
ABI26_0_0RCT_EXPORT_SHADOW_PROPERTY(paddingRight, ABI26_0_0YGValue)
ABI26_0_0RCT_EXPORT_SHADOW_PROPERTY(paddingBottom, ABI26_0_0YGValue)
ABI26_0_0RCT_EXPORT_SHADOW_PROPERTY(paddingLeft, ABI26_0_0YGValue)
ABI26_0_0RCT_EXPORT_SHADOW_PROPERTY(paddingStart, ABI26_0_0YGValue)
ABI26_0_0RCT_EXPORT_SHADOW_PROPERTY(paddingEnd, ABI26_0_0YGValue)
ABI26_0_0RCT_EXPORT_SHADOW_PROPERTY(paddingVertical, ABI26_0_0YGValue)
ABI26_0_0RCT_EXPORT_SHADOW_PROPERTY(paddingHorizontal, ABI26_0_0YGValue)
ABI26_0_0RCT_EXPORT_SHADOW_PROPERTY(padding, ABI26_0_0YGValue)

ABI26_0_0RCT_EXPORT_SHADOW_PROPERTY(flex, float)
ABI26_0_0RCT_EXPORT_SHADOW_PROPERTY(flexGrow, float)
ABI26_0_0RCT_EXPORT_SHADOW_PROPERTY(flexShrink, float)
ABI26_0_0RCT_EXPORT_SHADOW_PROPERTY(flexBasis, ABI26_0_0YGValue)
ABI26_0_0RCT_EXPORT_SHADOW_PROPERTY(flexDirection, ABI26_0_0YGFlexDirection)
ABI26_0_0RCT_EXPORT_SHADOW_PROPERTY(flexWrap, ABI26_0_0YGWrap)
ABI26_0_0RCT_EXPORT_SHADOW_PROPERTY(justifyContent, ABI26_0_0YGJustify)
ABI26_0_0RCT_EXPORT_SHADOW_PROPERTY(alignItems, ABI26_0_0YGAlign)
ABI26_0_0RCT_EXPORT_SHADOW_PROPERTY(alignSelf, ABI26_0_0YGAlign)
ABI26_0_0RCT_EXPORT_SHADOW_PROPERTY(alignContent, ABI26_0_0YGAlign)
ABI26_0_0RCT_EXPORT_SHADOW_PROPERTY(position, ABI26_0_0YGPositionType)
ABI26_0_0RCT_EXPORT_SHADOW_PROPERTY(aspectRatio, float)

ABI26_0_0RCT_EXPORT_SHADOW_PROPERTY(overflow, ABI26_0_0YGOverflow)
ABI26_0_0RCT_EXPORT_SHADOW_PROPERTY(display, ABI26_0_0YGDisplay)

ABI26_0_0RCT_EXPORT_SHADOW_PROPERTY(onLayout, ABI26_0_0RCTDirectEventBlock)

ABI26_0_0RCT_EXPORT_SHADOW_PROPERTY(direction, ABI26_0_0YGDirection)

@end
