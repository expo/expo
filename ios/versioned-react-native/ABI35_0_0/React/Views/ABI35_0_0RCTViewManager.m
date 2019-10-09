/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "ABI35_0_0RCTViewManager.h"

#import "ABI35_0_0RCTBorderStyle.h"
#import "ABI35_0_0RCTBridge.h"
#import "ABI35_0_0RCTConvert.h"
#import "ABI35_0_0RCTEventDispatcher.h"
#import "ABI35_0_0RCTLog.h"
#import "ABI35_0_0RCTShadowView.h"
#import "ABI35_0_0RCTUIManager.h"
#import "ABI35_0_0RCTUIManagerUtils.h"
#import "ABI35_0_0RCTUtils.h"
#import "ABI35_0_0RCTView.h"
#import "UIView+ReactABI35_0_0.h"
#import "ABI35_0_0RCTConvert+Transform.h"

#if TARGET_OS_TV
#import "ABI35_0_0RCTTVView.h"
#endif

@implementation ABI35_0_0RCTConvert(UIAccessibilityTraits)

ABI35_0_0RCT_MULTI_ENUM_CONVERTER(UIAccessibilityTraits, (@{
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

@implementation ABI35_0_0RCTViewManager

@synthesize bridge = _bridge;

ABI35_0_0RCT_EXPORT_MODULE()

- (dispatch_queue_t)methodQueue
{
  return ABI35_0_0RCTGetUIManagerQueue();
}

- (UIView *)view
{
#if TARGET_OS_TV
  return [ABI35_0_0RCTTVView new];
#else
  return [ABI35_0_0RCTView new];
#endif
}

- (ABI35_0_0RCTShadowView *)shadowView
{
  return [ABI35_0_0RCTShadowView new];
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
ABI35_0_0RCT_EXPORT_VIEW_PROPERTY(isTVSelectable, BOOL)
ABI35_0_0RCT_EXPORT_VIEW_PROPERTY(hasTVPreferredFocus, BOOL)
ABI35_0_0RCT_EXPORT_VIEW_PROPERTY(tvParallaxProperties, NSDictionary)
#endif

ABI35_0_0RCT_EXPORT_VIEW_PROPERTY(nativeID, NSString)

// Acessibility related properties
ABI35_0_0RCT_REMAP_VIEW_PROPERTY(accessible, ReactABI35_0_0AccessibilityElement.isAccessibilityElement, BOOL)
ABI35_0_0RCT_REMAP_VIEW_PROPERTY(accessibilityActions, ReactABI35_0_0AccessibilityElement.accessibilityActions, NSArray<NSString *>)
ABI35_0_0RCT_REMAP_VIEW_PROPERTY(accessibilityLabel, ReactABI35_0_0AccessibilityElement.accessibilityLabel, NSString)
ABI35_0_0RCT_REMAP_VIEW_PROPERTY(accessibilityHint, ReactABI35_0_0AccessibilityElement.accessibilityHint, NSString)
ABI35_0_0RCT_REMAP_VIEW_PROPERTY(accessibilityTraits, ReactABI35_0_0AccessibilityElement.accessibilityTraits, UIAccessibilityTraits)
ABI35_0_0RCT_REMAP_VIEW_PROPERTY(accessibilityViewIsModal, ReactABI35_0_0AccessibilityElement.accessibilityViewIsModal, BOOL)
ABI35_0_0RCT_REMAP_VIEW_PROPERTY(accessibilityElementsHidden, ReactABI35_0_0AccessibilityElement.accessibilityElementsHidden, BOOL)
ABI35_0_0RCT_REMAP_VIEW_PROPERTY(accessibilityIgnoresInvertColors, ReactABI35_0_0AccessibilityElement.shouldAccessibilityIgnoresInvertColors, BOOL)
ABI35_0_0RCT_REMAP_VIEW_PROPERTY(onAccessibilityAction, ReactABI35_0_0AccessibilityElement.onAccessibilityAction, ABI35_0_0RCTDirectEventBlock)
ABI35_0_0RCT_REMAP_VIEW_PROPERTY(onAccessibilityTap, ReactABI35_0_0AccessibilityElement.onAccessibilityTap, ABI35_0_0RCTDirectEventBlock)
ABI35_0_0RCT_REMAP_VIEW_PROPERTY(onMagicTap, ReactABI35_0_0AccessibilityElement.onMagicTap, ABI35_0_0RCTDirectEventBlock)
ABI35_0_0RCT_REMAP_VIEW_PROPERTY(onAccessibilityEscape, ReactABI35_0_0AccessibilityElement.onAccessibilityEscape, ABI35_0_0RCTDirectEventBlock)
ABI35_0_0RCT_REMAP_VIEW_PROPERTY(testID, ReactABI35_0_0AccessibilityElement.accessibilityIdentifier, NSString)

ABI35_0_0RCT_EXPORT_VIEW_PROPERTY(backgroundColor, UIColor)
ABI35_0_0RCT_REMAP_VIEW_PROPERTY(backfaceVisibility, layer.doubleSided, css_backface_visibility_t)
ABI35_0_0RCT_REMAP_VIEW_PROPERTY(opacity, alpha, CGFloat)
ABI35_0_0RCT_REMAP_VIEW_PROPERTY(shadowColor, layer.shadowColor, CGColor)
ABI35_0_0RCT_REMAP_VIEW_PROPERTY(shadowOffset, layer.shadowOffset, CGSize)
ABI35_0_0RCT_REMAP_VIEW_PROPERTY(shadowOpacity, layer.shadowOpacity, float)
ABI35_0_0RCT_REMAP_VIEW_PROPERTY(shadowRadius, layer.shadowRadius, CGFloat)
ABI35_0_0RCT_CUSTOM_VIEW_PROPERTY(overflow, ABI35_0_0YGOverflow, ABI35_0_0RCTView)
{
  if (json) {
    view.clipsToBounds = [ABI35_0_0RCTConvert ABI35_0_0YGOverflow:json] != ABI35_0_0YGOverflowVisible;
  } else {
    view.clipsToBounds = defaultView.clipsToBounds;
  }
}
ABI35_0_0RCT_CUSTOM_VIEW_PROPERTY(shouldRasterizeIOS, BOOL, ABI35_0_0RCTView)
{
  view.layer.shouldRasterize = json ? [ABI35_0_0RCTConvert BOOL:json] : defaultView.layer.shouldRasterize;
  view.layer.rasterizationScale = view.layer.shouldRasterize ? [UIScreen mainScreen].scale : defaultView.layer.rasterizationScale;
}

ABI35_0_0RCT_CUSTOM_VIEW_PROPERTY(transform, CATransform3D, ABI35_0_0RCTView)
{
  view.layer.transform = json ? [ABI35_0_0RCTConvert CATransform3D:json] : defaultView.layer.transform;
  // TODO: Improve this by enabling edge antialiasing only for transforms with rotation or skewing
  view.layer.allowsEdgeAntialiasing = !CATransform3DIsIdentity(view.layer.transform);
}

ABI35_0_0RCT_CUSTOM_VIEW_PROPERTY(accessibilityRole, UIAccessibilityTraits, ABI35_0_0RCTView)
{
  // This mask must be kept in sync with the AccessibilityRoles enum defined in ViewAccessibility.js and DeprecatedViewAccessibility.js
  const UIAccessibilityTraits AccessibilityRolesMask = UIAccessibilityTraitNone | UIAccessibilityTraitButton | UIAccessibilityTraitLink | UIAccessibilityTraitSearchField | UIAccessibilityTraitImage | UIAccessibilityTraitKeyboardKey | UIAccessibilityTraitStaticText | UIAccessibilityTraitAdjustable | UIAccessibilityTraitHeader | UIAccessibilityTraitSummaryElement;

  UIAccessibilityTraits newTraits = json ? [ABI35_0_0RCTConvert UIAccessibilityTraits:json] : defaultView.accessibilityTraits;
  UIAccessibilityTraits maskedTraits = newTraits & AccessibilityRolesMask;
  view.ReactABI35_0_0AccessibilityElement.accessibilityTraits = (view.ReactABI35_0_0AccessibilityElement.accessibilityTraits & ~AccessibilityRolesMask) | maskedTraits;
}

ABI35_0_0RCT_CUSTOM_VIEW_PROPERTY(accessibilityStates, UIAccessibilityTraits, ABI35_0_0RCTView)
{
  // This mask must be kept in sync with the AccessibilityStates enum defined in ViewAccessibility.js and DeprecatedViewAccessibility.js
  const UIAccessibilityTraits AccessibilityStatesMask = UIAccessibilityTraitNotEnabled | UIAccessibilityTraitSelected;

  UIAccessibilityTraits newTraits = json ? [ABI35_0_0RCTConvert UIAccessibilityTraits:json] : defaultView.accessibilityTraits;
  UIAccessibilityTraits maskedTraits = newTraits & AccessibilityStatesMask;
  view.ReactABI35_0_0AccessibilityElement.accessibilityTraits = (view.ReactABI35_0_0AccessibilityElement.accessibilityTraits & ~AccessibilityStatesMask) | maskedTraits;
}

ABI35_0_0RCT_CUSTOM_VIEW_PROPERTY(pointerEvents, ABI35_0_0RCTPointerEvents, ABI35_0_0RCTView)
{
  if ([view respondsToSelector:@selector(setPointerEvents:)]) {
    view.pointerEvents = json ? [ABI35_0_0RCTConvert ABI35_0_0RCTPointerEvents:json] : defaultView.pointerEvents;
    return;
  }

  if (!json) {
    view.userInteractionEnabled = defaultView.userInteractionEnabled;
    return;
  }

  switch ([ABI35_0_0RCTConvert ABI35_0_0RCTPointerEvents:json]) {
    case ABI35_0_0RCTPointerEventsUnspecified:
      // Pointer events "unspecified" acts as if a stylesheet had not specified,
      // which is different than "auto" in CSS (which cannot and will not be
      // supported in `ReactABI35_0_0`. "auto" may override a parent's "none".
      // Unspecified values do not.
      // This wouldn't override a container view's `userInteractionEnabled = NO`
      view.userInteractionEnabled = YES;
    case ABI35_0_0RCTPointerEventsNone:
      view.userInteractionEnabled = NO;
      break;
    default:
      ABI35_0_0RCTLogError(@"UIView base class does not support pointerEvent value: %@", json);
  }
}
ABI35_0_0RCT_CUSTOM_VIEW_PROPERTY(removeClippedSubviews, BOOL, ABI35_0_0RCTView)
{
  if ([view respondsToSelector:@selector(setRemoveClippedSubviews:)]) {
    view.removeClippedSubviews = json ? [ABI35_0_0RCTConvert BOOL:json] : defaultView.removeClippedSubviews;
  }
}
ABI35_0_0RCT_CUSTOM_VIEW_PROPERTY(borderRadius, CGFloat, ABI35_0_0RCTView) {
  if ([view respondsToSelector:@selector(setBorderRadius:)]) {
    view.borderRadius = json ? [ABI35_0_0RCTConvert CGFloat:json] : defaultView.borderRadius;
  } else {
    view.layer.cornerRadius = json ? [ABI35_0_0RCTConvert CGFloat:json] : defaultView.layer.cornerRadius;
  }
}
ABI35_0_0RCT_CUSTOM_VIEW_PROPERTY(borderColor, CGColor, ABI35_0_0RCTView)
{
  if ([view respondsToSelector:@selector(setBorderColor:)]) {
    view.borderColor = json ? [ABI35_0_0RCTConvert CGColor:json] : defaultView.borderColor;
  } else {
    view.layer.borderColor = json ? [ABI35_0_0RCTConvert CGColor:json] : defaultView.layer.borderColor;
  }
}
ABI35_0_0RCT_CUSTOM_VIEW_PROPERTY(borderWidth, float, ABI35_0_0RCTView)
{
  if ([view respondsToSelector:@selector(setBorderWidth:)]) {
    view.borderWidth = json ? [ABI35_0_0RCTConvert CGFloat:json] : defaultView.borderWidth;
  } else {
    view.layer.borderWidth = json ? [ABI35_0_0RCTConvert CGFloat:json] : defaultView.layer.borderWidth;
  }
}
ABI35_0_0RCT_CUSTOM_VIEW_PROPERTY(borderStyle, ABI35_0_0RCTBorderStyle, ABI35_0_0RCTView)
{
  if ([view respondsToSelector:@selector(setBorderStyle:)]) {
    view.borderStyle = json ? [ABI35_0_0RCTConvert ABI35_0_0RCTBorderStyle:json] : defaultView.borderStyle;
  }
}
ABI35_0_0RCT_CUSTOM_VIEW_PROPERTY(hitSlop, UIEdgeInsets, ABI35_0_0RCTView)
{
  if ([view respondsToSelector:@selector(setHitTestEdgeInsets:)]) {
    if (json) {
      UIEdgeInsets hitSlopInsets = [ABI35_0_0RCTConvert UIEdgeInsets:json];
      view.hitTestEdgeInsets = UIEdgeInsetsMake(-hitSlopInsets.top, -hitSlopInsets.left, -hitSlopInsets.bottom, -hitSlopInsets.right);
    } else {
      view.hitTestEdgeInsets = defaultView.hitTestEdgeInsets;
    }
  }
}

#define ABI35_0_0RCT_VIEW_BORDER_PROPERTY(SIDE)                                  \
ABI35_0_0RCT_CUSTOM_VIEW_PROPERTY(border##SIDE##Width, float, ABI35_0_0RCTView)           \
{                                                                       \
  if ([view respondsToSelector:@selector(setBorder##SIDE##Width:)]) {   \
    view.border##SIDE##Width = json ? [ABI35_0_0RCTConvert CGFloat:json] : defaultView.border##SIDE##Width; \
  }                                                                     \
}                                                                       \
ABI35_0_0RCT_CUSTOM_VIEW_PROPERTY(border##SIDE##Color, UIColor, ABI35_0_0RCTView)         \
{                                                                       \
  if ([view respondsToSelector:@selector(setBorder##SIDE##Color:)]) {   \
    view.border##SIDE##Color = json ? [ABI35_0_0RCTConvert CGColor:json] : defaultView.border##SIDE##Color; \
  }                                                                     \
}

ABI35_0_0RCT_VIEW_BORDER_PROPERTY(Top)
ABI35_0_0RCT_VIEW_BORDER_PROPERTY(Right)
ABI35_0_0RCT_VIEW_BORDER_PROPERTY(Bottom)
ABI35_0_0RCT_VIEW_BORDER_PROPERTY(Left)
ABI35_0_0RCT_VIEW_BORDER_PROPERTY(Start)
ABI35_0_0RCT_VIEW_BORDER_PROPERTY(End)

#define ABI35_0_0RCT_VIEW_BORDER_RADIUS_PROPERTY(SIDE)                           \
ABI35_0_0RCT_CUSTOM_VIEW_PROPERTY(border##SIDE##Radius, CGFloat, ABI35_0_0RCTView)        \
{                                                                       \
  if ([view respondsToSelector:@selector(setBorder##SIDE##Radius:)]) {  \
    view.border##SIDE##Radius = json ? [ABI35_0_0RCTConvert CGFloat:json] : defaultView.border##SIDE##Radius; \
  }                                                                     \
}                                                                       \

ABI35_0_0RCT_VIEW_BORDER_RADIUS_PROPERTY(TopLeft)
ABI35_0_0RCT_VIEW_BORDER_RADIUS_PROPERTY(TopRight)
ABI35_0_0RCT_VIEW_BORDER_RADIUS_PROPERTY(TopStart)
ABI35_0_0RCT_VIEW_BORDER_RADIUS_PROPERTY(TopEnd)
ABI35_0_0RCT_VIEW_BORDER_RADIUS_PROPERTY(BottomLeft)
ABI35_0_0RCT_VIEW_BORDER_RADIUS_PROPERTY(BottomRight)
ABI35_0_0RCT_VIEW_BORDER_RADIUS_PROPERTY(BottomStart)
ABI35_0_0RCT_VIEW_BORDER_RADIUS_PROPERTY(BottomEnd)

ABI35_0_0RCT_REMAP_VIEW_PROPERTY(display, ReactABI35_0_0Display, ABI35_0_0YGDisplay)
ABI35_0_0RCT_REMAP_VIEW_PROPERTY(zIndex, ReactABI35_0_0ZIndex, NSInteger)

#pragma mark - ShadowView properties

ABI35_0_0RCT_EXPORT_SHADOW_PROPERTY(top, ABI35_0_0YGValue)
ABI35_0_0RCT_EXPORT_SHADOW_PROPERTY(right, ABI35_0_0YGValue)
ABI35_0_0RCT_EXPORT_SHADOW_PROPERTY(start, ABI35_0_0YGValue)
ABI35_0_0RCT_EXPORT_SHADOW_PROPERTY(end, ABI35_0_0YGValue)
ABI35_0_0RCT_EXPORT_SHADOW_PROPERTY(bottom, ABI35_0_0YGValue)
ABI35_0_0RCT_EXPORT_SHADOW_PROPERTY(left, ABI35_0_0YGValue)

ABI35_0_0RCT_EXPORT_SHADOW_PROPERTY(width, ABI35_0_0YGValue)
ABI35_0_0RCT_EXPORT_SHADOW_PROPERTY(height, ABI35_0_0YGValue)

ABI35_0_0RCT_EXPORT_SHADOW_PROPERTY(minWidth, ABI35_0_0YGValue)
ABI35_0_0RCT_EXPORT_SHADOW_PROPERTY(maxWidth, ABI35_0_0YGValue)
ABI35_0_0RCT_EXPORT_SHADOW_PROPERTY(minHeight, ABI35_0_0YGValue)
ABI35_0_0RCT_EXPORT_SHADOW_PROPERTY(maxHeight, ABI35_0_0YGValue)

ABI35_0_0RCT_EXPORT_SHADOW_PROPERTY(borderTopWidth, float)
ABI35_0_0RCT_EXPORT_SHADOW_PROPERTY(borderRightWidth, float)
ABI35_0_0RCT_EXPORT_SHADOW_PROPERTY(borderBottomWidth, float)
ABI35_0_0RCT_EXPORT_SHADOW_PROPERTY(borderLeftWidth, float)
ABI35_0_0RCT_EXPORT_SHADOW_PROPERTY(borderStartWidth, float)
ABI35_0_0RCT_EXPORT_SHADOW_PROPERTY(borderEndWidth, float)
ABI35_0_0RCT_EXPORT_SHADOW_PROPERTY(borderWidth, float)

ABI35_0_0RCT_EXPORT_SHADOW_PROPERTY(marginTop, ABI35_0_0YGValue)
ABI35_0_0RCT_EXPORT_SHADOW_PROPERTY(marginRight, ABI35_0_0YGValue)
ABI35_0_0RCT_EXPORT_SHADOW_PROPERTY(marginBottom, ABI35_0_0YGValue)
ABI35_0_0RCT_EXPORT_SHADOW_PROPERTY(marginLeft, ABI35_0_0YGValue)
ABI35_0_0RCT_EXPORT_SHADOW_PROPERTY(marginStart, ABI35_0_0YGValue)
ABI35_0_0RCT_EXPORT_SHADOW_PROPERTY(marginEnd, ABI35_0_0YGValue)
ABI35_0_0RCT_EXPORT_SHADOW_PROPERTY(marginVertical, ABI35_0_0YGValue)
ABI35_0_0RCT_EXPORT_SHADOW_PROPERTY(marginHorizontal, ABI35_0_0YGValue)
ABI35_0_0RCT_EXPORT_SHADOW_PROPERTY(margin, ABI35_0_0YGValue)

ABI35_0_0RCT_EXPORT_SHADOW_PROPERTY(paddingTop, ABI35_0_0YGValue)
ABI35_0_0RCT_EXPORT_SHADOW_PROPERTY(paddingRight, ABI35_0_0YGValue)
ABI35_0_0RCT_EXPORT_SHADOW_PROPERTY(paddingBottom, ABI35_0_0YGValue)
ABI35_0_0RCT_EXPORT_SHADOW_PROPERTY(paddingLeft, ABI35_0_0YGValue)
ABI35_0_0RCT_EXPORT_SHADOW_PROPERTY(paddingStart, ABI35_0_0YGValue)
ABI35_0_0RCT_EXPORT_SHADOW_PROPERTY(paddingEnd, ABI35_0_0YGValue)
ABI35_0_0RCT_EXPORT_SHADOW_PROPERTY(paddingVertical, ABI35_0_0YGValue)
ABI35_0_0RCT_EXPORT_SHADOW_PROPERTY(paddingHorizontal, ABI35_0_0YGValue)
ABI35_0_0RCT_EXPORT_SHADOW_PROPERTY(padding, ABI35_0_0YGValue)

ABI35_0_0RCT_EXPORT_SHADOW_PROPERTY(flex, float)
ABI35_0_0RCT_EXPORT_SHADOW_PROPERTY(flexGrow, float)
ABI35_0_0RCT_EXPORT_SHADOW_PROPERTY(flexShrink, float)
ABI35_0_0RCT_EXPORT_SHADOW_PROPERTY(flexBasis, ABI35_0_0YGValue)
ABI35_0_0RCT_EXPORT_SHADOW_PROPERTY(flexDirection, ABI35_0_0YGFlexDirection)
ABI35_0_0RCT_EXPORT_SHADOW_PROPERTY(flexWrap, ABI35_0_0YGWrap)
ABI35_0_0RCT_EXPORT_SHADOW_PROPERTY(justifyContent, ABI35_0_0YGJustify)
ABI35_0_0RCT_EXPORT_SHADOW_PROPERTY(alignItems, ABI35_0_0YGAlign)
ABI35_0_0RCT_EXPORT_SHADOW_PROPERTY(alignSelf, ABI35_0_0YGAlign)
ABI35_0_0RCT_EXPORT_SHADOW_PROPERTY(alignContent, ABI35_0_0YGAlign)
ABI35_0_0RCT_EXPORT_SHADOW_PROPERTY(position, ABI35_0_0YGPositionType)
ABI35_0_0RCT_EXPORT_SHADOW_PROPERTY(aspectRatio, float)

ABI35_0_0RCT_EXPORT_SHADOW_PROPERTY(overflow, ABI35_0_0YGOverflow)
ABI35_0_0RCT_EXPORT_SHADOW_PROPERTY(display, ABI35_0_0YGDisplay)

ABI35_0_0RCT_EXPORT_SHADOW_PROPERTY(onLayout, ABI35_0_0RCTDirectEventBlock)

ABI35_0_0RCT_EXPORT_SHADOW_PROPERTY(direction, ABI35_0_0YGDirection)

@end
