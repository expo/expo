/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "ABI33_0_0RCTViewManager.h"

#import "ABI33_0_0RCTBorderStyle.h"
#import "ABI33_0_0RCTBridge.h"
#import "ABI33_0_0RCTConvert.h"
#import "ABI33_0_0RCTEventDispatcher.h"
#import "ABI33_0_0RCTLog.h"
#import "ABI33_0_0RCTShadowView.h"
#import "ABI33_0_0RCTUIManager.h"
#import "ABI33_0_0RCTUIManagerUtils.h"
#import "ABI33_0_0RCTUtils.h"
#import "ABI33_0_0RCTView.h"
#import "UIView+ReactABI33_0_0.h"
#import "ABI33_0_0RCTConvert+Transform.h"

#if TARGET_OS_TV
#import "ABI33_0_0RCTTVView.h"
#endif

@implementation ABI33_0_0RCTConvert(UIAccessibilityTraits)

ABI33_0_0RCT_MULTI_ENUM_CONVERTER(UIAccessibilityTraits, (@{
  @"none": @(UIAccessibilityTraitNone),
  @"button": @(UIAccessibilityTraitButton),
  @"link": @(UIAccessibilityTraitLink),
  @"header": @(UIAccessibilityTraitHeader),
  @"search": @(UIAccessibilityTraitSearchField),
  @"image": @(UIAccessibilityTraitImage),
  @"imagebutton": @(UIAccessibilityTraitImage | UIAccessibilityTraitButton),
  @"selected": @(UIAccessibilityTraitSelected),
  @"plays": @(UIAccessibilityTraitPlaysSound),
  @"key": @(UIAccessibilityTraitKeyboardKey),
  @"keyboardkey": @(UIAccessibilityTraitKeyboardKey),
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

@implementation ABI33_0_0RCTViewManager

@synthesize bridge = _bridge;

ABI33_0_0RCT_EXPORT_MODULE()

- (dispatch_queue_t)methodQueue
{
  return ABI33_0_0RCTGetUIManagerQueue();
}

- (UIView *)view
{
#if TARGET_OS_TV
  return [ABI33_0_0RCTTVView new];
#else
  return [ABI33_0_0RCTView new];
#endif
}

- (ABI33_0_0RCTShadowView *)shadowView
{
  return [ABI33_0_0RCTShadowView new];
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

#pragma mark - View properties

#if TARGET_OS_TV
// Apple TV properties
ABI33_0_0RCT_EXPORT_VIEW_PROPERTY(isTVSelectable, BOOL)
ABI33_0_0RCT_EXPORT_VIEW_PROPERTY(hasTVPreferredFocus, BOOL)
ABI33_0_0RCT_EXPORT_VIEW_PROPERTY(tvParallaxProperties, NSDictionary)
#endif

ABI33_0_0RCT_EXPORT_VIEW_PROPERTY(nativeID, NSString)

// Acessibility related properties
ABI33_0_0RCT_REMAP_VIEW_PROPERTY(accessible, ReactABI33_0_0AccessibilityElement.isAccessibilityElement, BOOL)
ABI33_0_0RCT_REMAP_VIEW_PROPERTY(accessibilityActions, ReactABI33_0_0AccessibilityElement.accessibilityActions, NSArray<NSString *>)
ABI33_0_0RCT_REMAP_VIEW_PROPERTY(accessibilityLabel, ReactABI33_0_0AccessibilityElement.accessibilityLabel, NSString)
ABI33_0_0RCT_REMAP_VIEW_PROPERTY(accessibilityHint, ReactABI33_0_0AccessibilityElement.accessibilityHint, NSString)
ABI33_0_0RCT_REMAP_VIEW_PROPERTY(accessibilityTraits, ReactABI33_0_0AccessibilityElement.accessibilityTraits, UIAccessibilityTraits)
ABI33_0_0RCT_REMAP_VIEW_PROPERTY(accessibilityViewIsModal, ReactABI33_0_0AccessibilityElement.accessibilityViewIsModal, BOOL)
ABI33_0_0RCT_REMAP_VIEW_PROPERTY(accessibilityElementsHidden, ReactABI33_0_0AccessibilityElement.accessibilityElementsHidden, BOOL)
ABI33_0_0RCT_REMAP_VIEW_PROPERTY(accessibilityIgnoresInvertColors, ReactABI33_0_0AccessibilityElement.shouldAccessibilityIgnoresInvertColors, BOOL)
ABI33_0_0RCT_REMAP_VIEW_PROPERTY(onAccessibilityAction, ReactABI33_0_0AccessibilityElement.onAccessibilityAction, ABI33_0_0RCTDirectEventBlock)
ABI33_0_0RCT_REMAP_VIEW_PROPERTY(onAccessibilityTap, ReactABI33_0_0AccessibilityElement.onAccessibilityTap, ABI33_0_0RCTDirectEventBlock)
ABI33_0_0RCT_REMAP_VIEW_PROPERTY(onMagicTap, ReactABI33_0_0AccessibilityElement.onMagicTap, ABI33_0_0RCTDirectEventBlock)
ABI33_0_0RCT_REMAP_VIEW_PROPERTY(onAccessibilityEscape, ReactABI33_0_0AccessibilityElement.onAccessibilityEscape, ABI33_0_0RCTDirectEventBlock)
ABI33_0_0RCT_REMAP_VIEW_PROPERTY(testID, ReactABI33_0_0AccessibilityElement.accessibilityIdentifier, NSString)

ABI33_0_0RCT_EXPORT_VIEW_PROPERTY(backgroundColor, UIColor)
ABI33_0_0RCT_REMAP_VIEW_PROPERTY(backfaceVisibility, layer.doubleSided, css_backface_visibility_t)
ABI33_0_0RCT_REMAP_VIEW_PROPERTY(opacity, alpha, CGFloat)
ABI33_0_0RCT_REMAP_VIEW_PROPERTY(shadowColor, layer.shadowColor, CGColor)
ABI33_0_0RCT_REMAP_VIEW_PROPERTY(shadowOffset, layer.shadowOffset, CGSize)
ABI33_0_0RCT_REMAP_VIEW_PROPERTY(shadowOpacity, layer.shadowOpacity, float)
ABI33_0_0RCT_REMAP_VIEW_PROPERTY(shadowRadius, layer.shadowRadius, CGFloat)
ABI33_0_0RCT_CUSTOM_VIEW_PROPERTY(overflow, ABI33_0_0YGOverflow, ABI33_0_0RCTView)
{
  if (json) {
    view.clipsToBounds = [ABI33_0_0RCTConvert ABI33_0_0YGOverflow:json] != ABI33_0_0YGOverflowVisible;
  } else {
    view.clipsToBounds = defaultView.clipsToBounds;
  }
}
ABI33_0_0RCT_CUSTOM_VIEW_PROPERTY(shouldRasterizeIOS, BOOL, ABI33_0_0RCTView)
{
  view.layer.shouldRasterize = json ? [ABI33_0_0RCTConvert BOOL:json] : defaultView.layer.shouldRasterize;
  view.layer.rasterizationScale = view.layer.shouldRasterize ? [UIScreen mainScreen].scale : defaultView.layer.rasterizationScale;
}

ABI33_0_0RCT_CUSTOM_VIEW_PROPERTY(transform, CATransform3D, ABI33_0_0RCTView)
{
  view.layer.transform = json ? [ABI33_0_0RCTConvert CATransform3D:json] : defaultView.layer.transform;
  // TODO: Improve this by enabling edge antialiasing only for transforms with rotation or skewing
  view.layer.allowsEdgeAntialiasing = !CATransform3DIsIdentity(view.layer.transform);
}

ABI33_0_0RCT_CUSTOM_VIEW_PROPERTY(accessibilityRole, UIAccessibilityTraits, ABI33_0_0RCTView)
{
  // This mask must be kept in sync with the AccessibilityRoles enum defined in ViewAccessibility.js and DeprecatedViewAccessibility.js
  const UIAccessibilityTraits AccessibilityRolesMask = UIAccessibilityTraitNone | UIAccessibilityTraitButton | UIAccessibilityTraitLink | UIAccessibilityTraitSearchField | UIAccessibilityTraitImage | UIAccessibilityTraitKeyboardKey | UIAccessibilityTraitStaticText | UIAccessibilityTraitAdjustable | UIAccessibilityTraitHeader | UIAccessibilityTraitSummaryElement;

  UIAccessibilityTraits newTraits = json ? [ABI33_0_0RCTConvert UIAccessibilityTraits:json] : defaultView.accessibilityTraits;
  UIAccessibilityTraits maskedTraits = newTraits & AccessibilityRolesMask;
  view.ReactABI33_0_0AccessibilityElement.accessibilityTraits = (view.ReactABI33_0_0AccessibilityElement.accessibilityTraits & ~AccessibilityRolesMask) | maskedTraits;
}

ABI33_0_0RCT_CUSTOM_VIEW_PROPERTY(accessibilityStates, UIAccessibilityTraits, ABI33_0_0RCTView)
{
  // This mask must be kept in sync with the AccessibilityStates enum defined in ViewAccessibility.js and DeprecatedViewAccessibility.js
  const UIAccessibilityTraits AccessibilityStatesMask = UIAccessibilityTraitNotEnabled | UIAccessibilityTraitSelected;

  UIAccessibilityTraits newTraits = json ? [ABI33_0_0RCTConvert UIAccessibilityTraits:json] : defaultView.accessibilityTraits;
  UIAccessibilityTraits maskedTraits = newTraits & AccessibilityStatesMask;
  view.ReactABI33_0_0AccessibilityElement.accessibilityTraits = (view.ReactABI33_0_0AccessibilityElement.accessibilityTraits & ~AccessibilityStatesMask) | maskedTraits;
}

ABI33_0_0RCT_CUSTOM_VIEW_PROPERTY(pointerEvents, ABI33_0_0RCTPointerEvents, ABI33_0_0RCTView)
{
  if ([view respondsToSelector:@selector(setPointerEvents:)]) {
    view.pointerEvents = json ? [ABI33_0_0RCTConvert ABI33_0_0RCTPointerEvents:json] : defaultView.pointerEvents;
    return;
  }

  if (!json) {
    view.userInteractionEnabled = defaultView.userInteractionEnabled;
    return;
  }

  switch ([ABI33_0_0RCTConvert ABI33_0_0RCTPointerEvents:json]) {
    case ABI33_0_0RCTPointerEventsUnspecified:
      // Pointer events "unspecified" acts as if a stylesheet had not specified,
      // which is different than "auto" in CSS (which cannot and will not be
      // supported in `ReactABI33_0_0`. "auto" may override a parent's "none".
      // Unspecified values do not.
      // This wouldn't override a container view's `userInteractionEnabled = NO`
      view.userInteractionEnabled = YES;
    case ABI33_0_0RCTPointerEventsNone:
      view.userInteractionEnabled = NO;
      break;
    default:
      ABI33_0_0RCTLogError(@"UIView base class does not support pointerEvent value: %@", json);
  }
}
ABI33_0_0RCT_CUSTOM_VIEW_PROPERTY(removeClippedSubviews, BOOL, ABI33_0_0RCTView)
{
  if ([view respondsToSelector:@selector(setRemoveClippedSubviews:)]) {
    view.removeClippedSubviews = json ? [ABI33_0_0RCTConvert BOOL:json] : defaultView.removeClippedSubviews;
  }
}
ABI33_0_0RCT_CUSTOM_VIEW_PROPERTY(borderRadius, CGFloat, ABI33_0_0RCTView) {
  if ([view respondsToSelector:@selector(setBorderRadius:)]) {
    view.borderRadius = json ? [ABI33_0_0RCTConvert CGFloat:json] : defaultView.borderRadius;
  } else {
    view.layer.cornerRadius = json ? [ABI33_0_0RCTConvert CGFloat:json] : defaultView.layer.cornerRadius;
  }
}
ABI33_0_0RCT_CUSTOM_VIEW_PROPERTY(borderColor, CGColor, ABI33_0_0RCTView)
{
  if ([view respondsToSelector:@selector(setBorderColor:)]) {
    view.borderColor = json ? [ABI33_0_0RCTConvert CGColor:json] : defaultView.borderColor;
  } else {
    view.layer.borderColor = json ? [ABI33_0_0RCTConvert CGColor:json] : defaultView.layer.borderColor;
  }
}
ABI33_0_0RCT_CUSTOM_VIEW_PROPERTY(borderWidth, float, ABI33_0_0RCTView)
{
  if ([view respondsToSelector:@selector(setBorderWidth:)]) {
    view.borderWidth = json ? [ABI33_0_0RCTConvert CGFloat:json] : defaultView.borderWidth;
  } else {
    view.layer.borderWidth = json ? [ABI33_0_0RCTConvert CGFloat:json] : defaultView.layer.borderWidth;
  }
}
ABI33_0_0RCT_CUSTOM_VIEW_PROPERTY(borderStyle, ABI33_0_0RCTBorderStyle, ABI33_0_0RCTView)
{
  if ([view respondsToSelector:@selector(setBorderStyle:)]) {
    view.borderStyle = json ? [ABI33_0_0RCTConvert ABI33_0_0RCTBorderStyle:json] : defaultView.borderStyle;
  }
}
ABI33_0_0RCT_CUSTOM_VIEW_PROPERTY(hitSlop, UIEdgeInsets, ABI33_0_0RCTView)
{
  if ([view respondsToSelector:@selector(setHitTestEdgeInsets:)]) {
    if (json) {
      UIEdgeInsets hitSlopInsets = [ABI33_0_0RCTConvert UIEdgeInsets:json];
      view.hitTestEdgeInsets = UIEdgeInsetsMake(-hitSlopInsets.top, -hitSlopInsets.left, -hitSlopInsets.bottom, -hitSlopInsets.right);
    } else {
      view.hitTestEdgeInsets = defaultView.hitTestEdgeInsets;
    }
  }
}

#define ABI33_0_0RCT_VIEW_BORDER_PROPERTY(SIDE)                                  \
ABI33_0_0RCT_CUSTOM_VIEW_PROPERTY(border##SIDE##Width, float, ABI33_0_0RCTView)           \
{                                                                       \
  if ([view respondsToSelector:@selector(setBorder##SIDE##Width:)]) {   \
    view.border##SIDE##Width = json ? [ABI33_0_0RCTConvert CGFloat:json] : defaultView.border##SIDE##Width; \
  }                                                                     \
}                                                                       \
ABI33_0_0RCT_CUSTOM_VIEW_PROPERTY(border##SIDE##Color, UIColor, ABI33_0_0RCTView)         \
{                                                                       \
  if ([view respondsToSelector:@selector(setBorder##SIDE##Color:)]) {   \
    view.border##SIDE##Color = json ? [ABI33_0_0RCTConvert CGColor:json] : defaultView.border##SIDE##Color; \
  }                                                                     \
}

ABI33_0_0RCT_VIEW_BORDER_PROPERTY(Top)
ABI33_0_0RCT_VIEW_BORDER_PROPERTY(Right)
ABI33_0_0RCT_VIEW_BORDER_PROPERTY(Bottom)
ABI33_0_0RCT_VIEW_BORDER_PROPERTY(Left)
ABI33_0_0RCT_VIEW_BORDER_PROPERTY(Start)
ABI33_0_0RCT_VIEW_BORDER_PROPERTY(End)

#define ABI33_0_0RCT_VIEW_BORDER_RADIUS_PROPERTY(SIDE)                           \
ABI33_0_0RCT_CUSTOM_VIEW_PROPERTY(border##SIDE##Radius, CGFloat, ABI33_0_0RCTView)        \
{                                                                       \
  if ([view respondsToSelector:@selector(setBorder##SIDE##Radius:)]) {  \
    view.border##SIDE##Radius = json ? [ABI33_0_0RCTConvert CGFloat:json] : defaultView.border##SIDE##Radius; \
  }                                                                     \
}                                                                       \

ABI33_0_0RCT_VIEW_BORDER_RADIUS_PROPERTY(TopLeft)
ABI33_0_0RCT_VIEW_BORDER_RADIUS_PROPERTY(TopRight)
ABI33_0_0RCT_VIEW_BORDER_RADIUS_PROPERTY(TopStart)
ABI33_0_0RCT_VIEW_BORDER_RADIUS_PROPERTY(TopEnd)
ABI33_0_0RCT_VIEW_BORDER_RADIUS_PROPERTY(BottomLeft)
ABI33_0_0RCT_VIEW_BORDER_RADIUS_PROPERTY(BottomRight)
ABI33_0_0RCT_VIEW_BORDER_RADIUS_PROPERTY(BottomStart)
ABI33_0_0RCT_VIEW_BORDER_RADIUS_PROPERTY(BottomEnd)

ABI33_0_0RCT_REMAP_VIEW_PROPERTY(display, ReactABI33_0_0Display, ABI33_0_0YGDisplay)
ABI33_0_0RCT_REMAP_VIEW_PROPERTY(zIndex, ReactABI33_0_0ZIndex, NSInteger)

#pragma mark - ShadowView properties

ABI33_0_0RCT_EXPORT_SHADOW_PROPERTY(top, ABI33_0_0YGValue)
ABI33_0_0RCT_EXPORT_SHADOW_PROPERTY(right, ABI33_0_0YGValue)
ABI33_0_0RCT_EXPORT_SHADOW_PROPERTY(start, ABI33_0_0YGValue)
ABI33_0_0RCT_EXPORT_SHADOW_PROPERTY(end, ABI33_0_0YGValue)
ABI33_0_0RCT_EXPORT_SHADOW_PROPERTY(bottom, ABI33_0_0YGValue)
ABI33_0_0RCT_EXPORT_SHADOW_PROPERTY(left, ABI33_0_0YGValue)

ABI33_0_0RCT_EXPORT_SHADOW_PROPERTY(width, ABI33_0_0YGValue)
ABI33_0_0RCT_EXPORT_SHADOW_PROPERTY(height, ABI33_0_0YGValue)

ABI33_0_0RCT_EXPORT_SHADOW_PROPERTY(minWidth, ABI33_0_0YGValue)
ABI33_0_0RCT_EXPORT_SHADOW_PROPERTY(maxWidth, ABI33_0_0YGValue)
ABI33_0_0RCT_EXPORT_SHADOW_PROPERTY(minHeight, ABI33_0_0YGValue)
ABI33_0_0RCT_EXPORT_SHADOW_PROPERTY(maxHeight, ABI33_0_0YGValue)

ABI33_0_0RCT_EXPORT_SHADOW_PROPERTY(borderTopWidth, float)
ABI33_0_0RCT_EXPORT_SHADOW_PROPERTY(borderRightWidth, float)
ABI33_0_0RCT_EXPORT_SHADOW_PROPERTY(borderBottomWidth, float)
ABI33_0_0RCT_EXPORT_SHADOW_PROPERTY(borderLeftWidth, float)
ABI33_0_0RCT_EXPORT_SHADOW_PROPERTY(borderStartWidth, float)
ABI33_0_0RCT_EXPORT_SHADOW_PROPERTY(borderEndWidth, float)
ABI33_0_0RCT_EXPORT_SHADOW_PROPERTY(borderWidth, float)

ABI33_0_0RCT_EXPORT_SHADOW_PROPERTY(marginTop, ABI33_0_0YGValue)
ABI33_0_0RCT_EXPORT_SHADOW_PROPERTY(marginRight, ABI33_0_0YGValue)
ABI33_0_0RCT_EXPORT_SHADOW_PROPERTY(marginBottom, ABI33_0_0YGValue)
ABI33_0_0RCT_EXPORT_SHADOW_PROPERTY(marginLeft, ABI33_0_0YGValue)
ABI33_0_0RCT_EXPORT_SHADOW_PROPERTY(marginStart, ABI33_0_0YGValue)
ABI33_0_0RCT_EXPORT_SHADOW_PROPERTY(marginEnd, ABI33_0_0YGValue)
ABI33_0_0RCT_EXPORT_SHADOW_PROPERTY(marginVertical, ABI33_0_0YGValue)
ABI33_0_0RCT_EXPORT_SHADOW_PROPERTY(marginHorizontal, ABI33_0_0YGValue)
ABI33_0_0RCT_EXPORT_SHADOW_PROPERTY(margin, ABI33_0_0YGValue)

ABI33_0_0RCT_EXPORT_SHADOW_PROPERTY(paddingTop, ABI33_0_0YGValue)
ABI33_0_0RCT_EXPORT_SHADOW_PROPERTY(paddingRight, ABI33_0_0YGValue)
ABI33_0_0RCT_EXPORT_SHADOW_PROPERTY(paddingBottom, ABI33_0_0YGValue)
ABI33_0_0RCT_EXPORT_SHADOW_PROPERTY(paddingLeft, ABI33_0_0YGValue)
ABI33_0_0RCT_EXPORT_SHADOW_PROPERTY(paddingStart, ABI33_0_0YGValue)
ABI33_0_0RCT_EXPORT_SHADOW_PROPERTY(paddingEnd, ABI33_0_0YGValue)
ABI33_0_0RCT_EXPORT_SHADOW_PROPERTY(paddingVertical, ABI33_0_0YGValue)
ABI33_0_0RCT_EXPORT_SHADOW_PROPERTY(paddingHorizontal, ABI33_0_0YGValue)
ABI33_0_0RCT_EXPORT_SHADOW_PROPERTY(padding, ABI33_0_0YGValue)

ABI33_0_0RCT_EXPORT_SHADOW_PROPERTY(flex, float)
ABI33_0_0RCT_EXPORT_SHADOW_PROPERTY(flexGrow, float)
ABI33_0_0RCT_EXPORT_SHADOW_PROPERTY(flexShrink, float)
ABI33_0_0RCT_EXPORT_SHADOW_PROPERTY(flexBasis, ABI33_0_0YGValue)
ABI33_0_0RCT_EXPORT_SHADOW_PROPERTY(flexDirection, ABI33_0_0YGFlexDirection)
ABI33_0_0RCT_EXPORT_SHADOW_PROPERTY(flexWrap, ABI33_0_0YGWrap)
ABI33_0_0RCT_EXPORT_SHADOW_PROPERTY(justifyContent, ABI33_0_0YGJustify)
ABI33_0_0RCT_EXPORT_SHADOW_PROPERTY(alignItems, ABI33_0_0YGAlign)
ABI33_0_0RCT_EXPORT_SHADOW_PROPERTY(alignSelf, ABI33_0_0YGAlign)
ABI33_0_0RCT_EXPORT_SHADOW_PROPERTY(alignContent, ABI33_0_0YGAlign)
ABI33_0_0RCT_EXPORT_SHADOW_PROPERTY(position, ABI33_0_0YGPositionType)
ABI33_0_0RCT_EXPORT_SHADOW_PROPERTY(aspectRatio, float)

ABI33_0_0RCT_EXPORT_SHADOW_PROPERTY(overflow, ABI33_0_0YGOverflow)
ABI33_0_0RCT_EXPORT_SHADOW_PROPERTY(display, ABI33_0_0YGDisplay)

ABI33_0_0RCT_EXPORT_SHADOW_PROPERTY(onLayout, ABI33_0_0RCTDirectEventBlock)

ABI33_0_0RCT_EXPORT_SHADOW_PROPERTY(direction, ABI33_0_0YGDirection)

@end
