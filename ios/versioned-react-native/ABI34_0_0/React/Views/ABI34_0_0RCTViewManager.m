/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "ABI34_0_0RCTViewManager.h"

#import "ABI34_0_0RCTBorderStyle.h"
#import "ABI34_0_0RCTBridge.h"
#import "ABI34_0_0RCTConvert.h"
#import "ABI34_0_0RCTEventDispatcher.h"
#import "ABI34_0_0RCTLog.h"
#import "ABI34_0_0RCTShadowView.h"
#import "ABI34_0_0RCTUIManager.h"
#import "ABI34_0_0RCTUIManagerUtils.h"
#import "ABI34_0_0RCTUtils.h"
#import "ABI34_0_0RCTView.h"
#import "UIView+ReactABI34_0_0.h"
#import "ABI34_0_0RCTConvert+Transform.h"

#if TARGET_OS_TV
#import "ABI34_0_0RCTTVView.h"
#endif

@implementation ABI34_0_0RCTConvert(UIAccessibilityTraits)

ABI34_0_0RCT_MULTI_ENUM_CONVERTER(UIAccessibilityTraits, (@{
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

@implementation ABI34_0_0RCTViewManager

@synthesize bridge = _bridge;

ABI34_0_0RCT_EXPORT_MODULE()

- (dispatch_queue_t)methodQueue
{
  return ABI34_0_0RCTGetUIManagerQueue();
}

- (UIView *)view
{
#if TARGET_OS_TV
  return [ABI34_0_0RCTTVView new];
#else
  return [ABI34_0_0RCTView new];
#endif
}

- (ABI34_0_0RCTShadowView *)shadowView
{
  return [ABI34_0_0RCTShadowView new];
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
ABI34_0_0RCT_EXPORT_VIEW_PROPERTY(isTVSelectable, BOOL)
ABI34_0_0RCT_EXPORT_VIEW_PROPERTY(hasTVPreferredFocus, BOOL)
ABI34_0_0RCT_EXPORT_VIEW_PROPERTY(tvParallaxProperties, NSDictionary)
#endif

ABI34_0_0RCT_EXPORT_VIEW_PROPERTY(nativeID, NSString)

// Acessibility related properties
ABI34_0_0RCT_REMAP_VIEW_PROPERTY(accessible, ReactABI34_0_0AccessibilityElement.isAccessibilityElement, BOOL)
ABI34_0_0RCT_REMAP_VIEW_PROPERTY(accessibilityActions, ReactABI34_0_0AccessibilityElement.accessibilityActions, NSArray<NSString *>)
ABI34_0_0RCT_REMAP_VIEW_PROPERTY(accessibilityLabel, ReactABI34_0_0AccessibilityElement.accessibilityLabel, NSString)
ABI34_0_0RCT_REMAP_VIEW_PROPERTY(accessibilityHint, ReactABI34_0_0AccessibilityElement.accessibilityHint, NSString)
ABI34_0_0RCT_REMAP_VIEW_PROPERTY(accessibilityTraits, ReactABI34_0_0AccessibilityElement.accessibilityTraits, UIAccessibilityTraits)
ABI34_0_0RCT_REMAP_VIEW_PROPERTY(accessibilityViewIsModal, ReactABI34_0_0AccessibilityElement.accessibilityViewIsModal, BOOL)
ABI34_0_0RCT_REMAP_VIEW_PROPERTY(accessibilityElementsHidden, ReactABI34_0_0AccessibilityElement.accessibilityElementsHidden, BOOL)
ABI34_0_0RCT_REMAP_VIEW_PROPERTY(accessibilityIgnoresInvertColors, ReactABI34_0_0AccessibilityElement.shouldAccessibilityIgnoresInvertColors, BOOL)
ABI34_0_0RCT_REMAP_VIEW_PROPERTY(onAccessibilityAction, ReactABI34_0_0AccessibilityElement.onAccessibilityAction, ABI34_0_0RCTDirectEventBlock)
ABI34_0_0RCT_REMAP_VIEW_PROPERTY(onAccessibilityTap, ReactABI34_0_0AccessibilityElement.onAccessibilityTap, ABI34_0_0RCTDirectEventBlock)
ABI34_0_0RCT_REMAP_VIEW_PROPERTY(onMagicTap, ReactABI34_0_0AccessibilityElement.onMagicTap, ABI34_0_0RCTDirectEventBlock)
ABI34_0_0RCT_REMAP_VIEW_PROPERTY(onAccessibilityEscape, ReactABI34_0_0AccessibilityElement.onAccessibilityEscape, ABI34_0_0RCTDirectEventBlock)
ABI34_0_0RCT_REMAP_VIEW_PROPERTY(testID, ReactABI34_0_0AccessibilityElement.accessibilityIdentifier, NSString)

ABI34_0_0RCT_EXPORT_VIEW_PROPERTY(backgroundColor, UIColor)
ABI34_0_0RCT_REMAP_VIEW_PROPERTY(backfaceVisibility, layer.doubleSided, css_backface_visibility_t)
ABI34_0_0RCT_REMAP_VIEW_PROPERTY(opacity, alpha, CGFloat)
ABI34_0_0RCT_REMAP_VIEW_PROPERTY(shadowColor, layer.shadowColor, CGColor)
ABI34_0_0RCT_REMAP_VIEW_PROPERTY(shadowOffset, layer.shadowOffset, CGSize)
ABI34_0_0RCT_REMAP_VIEW_PROPERTY(shadowOpacity, layer.shadowOpacity, float)
ABI34_0_0RCT_REMAP_VIEW_PROPERTY(shadowRadius, layer.shadowRadius, CGFloat)
ABI34_0_0RCT_CUSTOM_VIEW_PROPERTY(overflow, ABI34_0_0YGOverflow, ABI34_0_0RCTView)
{
  if (json) {
    view.clipsToBounds = [ABI34_0_0RCTConvert ABI34_0_0YGOverflow:json] != ABI34_0_0YGOverflowVisible;
  } else {
    view.clipsToBounds = defaultView.clipsToBounds;
  }
}
ABI34_0_0RCT_CUSTOM_VIEW_PROPERTY(shouldRasterizeIOS, BOOL, ABI34_0_0RCTView)
{
  view.layer.shouldRasterize = json ? [ABI34_0_0RCTConvert BOOL:json] : defaultView.layer.shouldRasterize;
  view.layer.rasterizationScale = view.layer.shouldRasterize ? [UIScreen mainScreen].scale : defaultView.layer.rasterizationScale;
}

ABI34_0_0RCT_CUSTOM_VIEW_PROPERTY(transform, CATransform3D, ABI34_0_0RCTView)
{
  view.layer.transform = json ? [ABI34_0_0RCTConvert CATransform3D:json] : defaultView.layer.transform;
  // TODO: Improve this by enabling edge antialiasing only for transforms with rotation or skewing
  view.layer.allowsEdgeAntialiasing = !CATransform3DIsIdentity(view.layer.transform);
}

ABI34_0_0RCT_CUSTOM_VIEW_PROPERTY(accessibilityRole, UIAccessibilityTraits, ABI34_0_0RCTView)
{
  // This mask must be kept in sync with the AccessibilityRoles enum defined in ViewAccessibility.js and DeprecatedViewAccessibility.js
  const UIAccessibilityTraits AccessibilityRolesMask = UIAccessibilityTraitNone | UIAccessibilityTraitButton | UIAccessibilityTraitLink | UIAccessibilityTraitSearchField | UIAccessibilityTraitImage | UIAccessibilityTraitKeyboardKey | UIAccessibilityTraitStaticText | UIAccessibilityTraitAdjustable | UIAccessibilityTraitHeader | UIAccessibilityTraitSummaryElement;

  UIAccessibilityTraits newTraits = json ? [ABI34_0_0RCTConvert UIAccessibilityTraits:json] : defaultView.accessibilityTraits;
  UIAccessibilityTraits maskedTraits = newTraits & AccessibilityRolesMask;
  view.ReactABI34_0_0AccessibilityElement.accessibilityTraits = (view.ReactABI34_0_0AccessibilityElement.accessibilityTraits & ~AccessibilityRolesMask) | maskedTraits;
}

ABI34_0_0RCT_CUSTOM_VIEW_PROPERTY(accessibilityStates, UIAccessibilityTraits, ABI34_0_0RCTView)
{
  // This mask must be kept in sync with the AccessibilityStates enum defined in ViewAccessibility.js and DeprecatedViewAccessibility.js
  const UIAccessibilityTraits AccessibilityStatesMask = UIAccessibilityTraitNotEnabled | UIAccessibilityTraitSelected;

  UIAccessibilityTraits newTraits = json ? [ABI34_0_0RCTConvert UIAccessibilityTraits:json] : defaultView.accessibilityTraits;
  UIAccessibilityTraits maskedTraits = newTraits & AccessibilityStatesMask;
  view.ReactABI34_0_0AccessibilityElement.accessibilityTraits = (view.ReactABI34_0_0AccessibilityElement.accessibilityTraits & ~AccessibilityStatesMask) | maskedTraits;
}

ABI34_0_0RCT_CUSTOM_VIEW_PROPERTY(pointerEvents, ABI34_0_0RCTPointerEvents, ABI34_0_0RCTView)
{
  if ([view respondsToSelector:@selector(setPointerEvents:)]) {
    view.pointerEvents = json ? [ABI34_0_0RCTConvert ABI34_0_0RCTPointerEvents:json] : defaultView.pointerEvents;
    return;
  }

  if (!json) {
    view.userInteractionEnabled = defaultView.userInteractionEnabled;
    return;
  }

  switch ([ABI34_0_0RCTConvert ABI34_0_0RCTPointerEvents:json]) {
    case ABI34_0_0RCTPointerEventsUnspecified:
      // Pointer events "unspecified" acts as if a stylesheet had not specified,
      // which is different than "auto" in CSS (which cannot and will not be
      // supported in `ReactABI34_0_0`. "auto" may override a parent's "none".
      // Unspecified values do not.
      // This wouldn't override a container view's `userInteractionEnabled = NO`
      view.userInteractionEnabled = YES;
    case ABI34_0_0RCTPointerEventsNone:
      view.userInteractionEnabled = NO;
      break;
    default:
      ABI34_0_0RCTLogError(@"UIView base class does not support pointerEvent value: %@", json);
  }
}
ABI34_0_0RCT_CUSTOM_VIEW_PROPERTY(removeClippedSubviews, BOOL, ABI34_0_0RCTView)
{
  if ([view respondsToSelector:@selector(setRemoveClippedSubviews:)]) {
    view.removeClippedSubviews = json ? [ABI34_0_0RCTConvert BOOL:json] : defaultView.removeClippedSubviews;
  }
}
ABI34_0_0RCT_CUSTOM_VIEW_PROPERTY(borderRadius, CGFloat, ABI34_0_0RCTView) {
  if ([view respondsToSelector:@selector(setBorderRadius:)]) {
    view.borderRadius = json ? [ABI34_0_0RCTConvert CGFloat:json] : defaultView.borderRadius;
  } else {
    view.layer.cornerRadius = json ? [ABI34_0_0RCTConvert CGFloat:json] : defaultView.layer.cornerRadius;
  }
}
ABI34_0_0RCT_CUSTOM_VIEW_PROPERTY(borderColor, CGColor, ABI34_0_0RCTView)
{
  if ([view respondsToSelector:@selector(setBorderColor:)]) {
    view.borderColor = json ? [ABI34_0_0RCTConvert CGColor:json] : defaultView.borderColor;
  } else {
    view.layer.borderColor = json ? [ABI34_0_0RCTConvert CGColor:json] : defaultView.layer.borderColor;
  }
}
ABI34_0_0RCT_CUSTOM_VIEW_PROPERTY(borderWidth, float, ABI34_0_0RCTView)
{
  if ([view respondsToSelector:@selector(setBorderWidth:)]) {
    view.borderWidth = json ? [ABI34_0_0RCTConvert CGFloat:json] : defaultView.borderWidth;
  } else {
    view.layer.borderWidth = json ? [ABI34_0_0RCTConvert CGFloat:json] : defaultView.layer.borderWidth;
  }
}
ABI34_0_0RCT_CUSTOM_VIEW_PROPERTY(borderStyle, ABI34_0_0RCTBorderStyle, ABI34_0_0RCTView)
{
  if ([view respondsToSelector:@selector(setBorderStyle:)]) {
    view.borderStyle = json ? [ABI34_0_0RCTConvert ABI34_0_0RCTBorderStyle:json] : defaultView.borderStyle;
  }
}
ABI34_0_0RCT_CUSTOM_VIEW_PROPERTY(hitSlop, UIEdgeInsets, ABI34_0_0RCTView)
{
  if ([view respondsToSelector:@selector(setHitTestEdgeInsets:)]) {
    if (json) {
      UIEdgeInsets hitSlopInsets = [ABI34_0_0RCTConvert UIEdgeInsets:json];
      view.hitTestEdgeInsets = UIEdgeInsetsMake(-hitSlopInsets.top, -hitSlopInsets.left, -hitSlopInsets.bottom, -hitSlopInsets.right);
    } else {
      view.hitTestEdgeInsets = defaultView.hitTestEdgeInsets;
    }
  }
}

#define ABI34_0_0RCT_VIEW_BORDER_PROPERTY(SIDE)                                  \
ABI34_0_0RCT_CUSTOM_VIEW_PROPERTY(border##SIDE##Width, float, ABI34_0_0RCTView)           \
{                                                                       \
  if ([view respondsToSelector:@selector(setBorder##SIDE##Width:)]) {   \
    view.border##SIDE##Width = json ? [ABI34_0_0RCTConvert CGFloat:json] : defaultView.border##SIDE##Width; \
  }                                                                     \
}                                                                       \
ABI34_0_0RCT_CUSTOM_VIEW_PROPERTY(border##SIDE##Color, UIColor, ABI34_0_0RCTView)         \
{                                                                       \
  if ([view respondsToSelector:@selector(setBorder##SIDE##Color:)]) {   \
    view.border##SIDE##Color = json ? [ABI34_0_0RCTConvert CGColor:json] : defaultView.border##SIDE##Color; \
  }                                                                     \
}

ABI34_0_0RCT_VIEW_BORDER_PROPERTY(Top)
ABI34_0_0RCT_VIEW_BORDER_PROPERTY(Right)
ABI34_0_0RCT_VIEW_BORDER_PROPERTY(Bottom)
ABI34_0_0RCT_VIEW_BORDER_PROPERTY(Left)
ABI34_0_0RCT_VIEW_BORDER_PROPERTY(Start)
ABI34_0_0RCT_VIEW_BORDER_PROPERTY(End)

#define ABI34_0_0RCT_VIEW_BORDER_RADIUS_PROPERTY(SIDE)                           \
ABI34_0_0RCT_CUSTOM_VIEW_PROPERTY(border##SIDE##Radius, CGFloat, ABI34_0_0RCTView)        \
{                                                                       \
  if ([view respondsToSelector:@selector(setBorder##SIDE##Radius:)]) {  \
    view.border##SIDE##Radius = json ? [ABI34_0_0RCTConvert CGFloat:json] : defaultView.border##SIDE##Radius; \
  }                                                                     \
}                                                                       \

ABI34_0_0RCT_VIEW_BORDER_RADIUS_PROPERTY(TopLeft)
ABI34_0_0RCT_VIEW_BORDER_RADIUS_PROPERTY(TopRight)
ABI34_0_0RCT_VIEW_BORDER_RADIUS_PROPERTY(TopStart)
ABI34_0_0RCT_VIEW_BORDER_RADIUS_PROPERTY(TopEnd)
ABI34_0_0RCT_VIEW_BORDER_RADIUS_PROPERTY(BottomLeft)
ABI34_0_0RCT_VIEW_BORDER_RADIUS_PROPERTY(BottomRight)
ABI34_0_0RCT_VIEW_BORDER_RADIUS_PROPERTY(BottomStart)
ABI34_0_0RCT_VIEW_BORDER_RADIUS_PROPERTY(BottomEnd)

ABI34_0_0RCT_REMAP_VIEW_PROPERTY(display, ReactABI34_0_0Display, ABI34_0_0YGDisplay)
ABI34_0_0RCT_REMAP_VIEW_PROPERTY(zIndex, ReactABI34_0_0ZIndex, NSInteger)

#pragma mark - ShadowView properties

ABI34_0_0RCT_EXPORT_SHADOW_PROPERTY(top, ABI34_0_0YGValue)
ABI34_0_0RCT_EXPORT_SHADOW_PROPERTY(right, ABI34_0_0YGValue)
ABI34_0_0RCT_EXPORT_SHADOW_PROPERTY(start, ABI34_0_0YGValue)
ABI34_0_0RCT_EXPORT_SHADOW_PROPERTY(end, ABI34_0_0YGValue)
ABI34_0_0RCT_EXPORT_SHADOW_PROPERTY(bottom, ABI34_0_0YGValue)
ABI34_0_0RCT_EXPORT_SHADOW_PROPERTY(left, ABI34_0_0YGValue)

ABI34_0_0RCT_EXPORT_SHADOW_PROPERTY(width, ABI34_0_0YGValue)
ABI34_0_0RCT_EXPORT_SHADOW_PROPERTY(height, ABI34_0_0YGValue)

ABI34_0_0RCT_EXPORT_SHADOW_PROPERTY(minWidth, ABI34_0_0YGValue)
ABI34_0_0RCT_EXPORT_SHADOW_PROPERTY(maxWidth, ABI34_0_0YGValue)
ABI34_0_0RCT_EXPORT_SHADOW_PROPERTY(minHeight, ABI34_0_0YGValue)
ABI34_0_0RCT_EXPORT_SHADOW_PROPERTY(maxHeight, ABI34_0_0YGValue)

ABI34_0_0RCT_EXPORT_SHADOW_PROPERTY(borderTopWidth, float)
ABI34_0_0RCT_EXPORT_SHADOW_PROPERTY(borderRightWidth, float)
ABI34_0_0RCT_EXPORT_SHADOW_PROPERTY(borderBottomWidth, float)
ABI34_0_0RCT_EXPORT_SHADOW_PROPERTY(borderLeftWidth, float)
ABI34_0_0RCT_EXPORT_SHADOW_PROPERTY(borderStartWidth, float)
ABI34_0_0RCT_EXPORT_SHADOW_PROPERTY(borderEndWidth, float)
ABI34_0_0RCT_EXPORT_SHADOW_PROPERTY(borderWidth, float)

ABI34_0_0RCT_EXPORT_SHADOW_PROPERTY(marginTop, ABI34_0_0YGValue)
ABI34_0_0RCT_EXPORT_SHADOW_PROPERTY(marginRight, ABI34_0_0YGValue)
ABI34_0_0RCT_EXPORT_SHADOW_PROPERTY(marginBottom, ABI34_0_0YGValue)
ABI34_0_0RCT_EXPORT_SHADOW_PROPERTY(marginLeft, ABI34_0_0YGValue)
ABI34_0_0RCT_EXPORT_SHADOW_PROPERTY(marginStart, ABI34_0_0YGValue)
ABI34_0_0RCT_EXPORT_SHADOW_PROPERTY(marginEnd, ABI34_0_0YGValue)
ABI34_0_0RCT_EXPORT_SHADOW_PROPERTY(marginVertical, ABI34_0_0YGValue)
ABI34_0_0RCT_EXPORT_SHADOW_PROPERTY(marginHorizontal, ABI34_0_0YGValue)
ABI34_0_0RCT_EXPORT_SHADOW_PROPERTY(margin, ABI34_0_0YGValue)

ABI34_0_0RCT_EXPORT_SHADOW_PROPERTY(paddingTop, ABI34_0_0YGValue)
ABI34_0_0RCT_EXPORT_SHADOW_PROPERTY(paddingRight, ABI34_0_0YGValue)
ABI34_0_0RCT_EXPORT_SHADOW_PROPERTY(paddingBottom, ABI34_0_0YGValue)
ABI34_0_0RCT_EXPORT_SHADOW_PROPERTY(paddingLeft, ABI34_0_0YGValue)
ABI34_0_0RCT_EXPORT_SHADOW_PROPERTY(paddingStart, ABI34_0_0YGValue)
ABI34_0_0RCT_EXPORT_SHADOW_PROPERTY(paddingEnd, ABI34_0_0YGValue)
ABI34_0_0RCT_EXPORT_SHADOW_PROPERTY(paddingVertical, ABI34_0_0YGValue)
ABI34_0_0RCT_EXPORT_SHADOW_PROPERTY(paddingHorizontal, ABI34_0_0YGValue)
ABI34_0_0RCT_EXPORT_SHADOW_PROPERTY(padding, ABI34_0_0YGValue)

ABI34_0_0RCT_EXPORT_SHADOW_PROPERTY(flex, float)
ABI34_0_0RCT_EXPORT_SHADOW_PROPERTY(flexGrow, float)
ABI34_0_0RCT_EXPORT_SHADOW_PROPERTY(flexShrink, float)
ABI34_0_0RCT_EXPORT_SHADOW_PROPERTY(flexBasis, ABI34_0_0YGValue)
ABI34_0_0RCT_EXPORT_SHADOW_PROPERTY(flexDirection, ABI34_0_0YGFlexDirection)
ABI34_0_0RCT_EXPORT_SHADOW_PROPERTY(flexWrap, ABI34_0_0YGWrap)
ABI34_0_0RCT_EXPORT_SHADOW_PROPERTY(justifyContent, ABI34_0_0YGJustify)
ABI34_0_0RCT_EXPORT_SHADOW_PROPERTY(alignItems, ABI34_0_0YGAlign)
ABI34_0_0RCT_EXPORT_SHADOW_PROPERTY(alignSelf, ABI34_0_0YGAlign)
ABI34_0_0RCT_EXPORT_SHADOW_PROPERTY(alignContent, ABI34_0_0YGAlign)
ABI34_0_0RCT_EXPORT_SHADOW_PROPERTY(position, ABI34_0_0YGPositionType)
ABI34_0_0RCT_EXPORT_SHADOW_PROPERTY(aspectRatio, float)

ABI34_0_0RCT_EXPORT_SHADOW_PROPERTY(overflow, ABI34_0_0YGOverflow)
ABI34_0_0RCT_EXPORT_SHADOW_PROPERTY(display, ABI34_0_0YGDisplay)

ABI34_0_0RCT_EXPORT_SHADOW_PROPERTY(onLayout, ABI34_0_0RCTDirectEventBlock)

ABI34_0_0RCT_EXPORT_SHADOW_PROPERTY(direction, ABI34_0_0YGDirection)

@end
