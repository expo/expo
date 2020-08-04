/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "ABI38_0_0RCTViewManager.h"

#import "ABI38_0_0RCTBorderStyle.h"
#import "ABI38_0_0RCTBridge.h"
#import "ABI38_0_0RCTConvert.h"
#import "ABI38_0_0RCTEventDispatcher.h"
#import "ABI38_0_0RCTLog.h"
#import "ABI38_0_0RCTShadowView.h"
#import "ABI38_0_0RCTUIManager.h"
#import "ABI38_0_0RCTUIManagerUtils.h"
#import "ABI38_0_0RCTUtils.h"
#import "ABI38_0_0RCTView.h"
#import "ABI38_0_0UIView+React.h"
#import "ABI38_0_0RCTConvert+Transform.h"

#if TARGET_OS_TV
#import "ABI38_0_0RCTTVView.h"
#endif

@implementation ABI38_0_0RCTConvert(UIAccessibilityTraits)

ABI38_0_0RCT_MULTI_ENUM_CONVERTER(UIAccessibilityTraits, (@{
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
  @"alert": @(UIAccessibilityTraitNone),
  @"checkbox": @(UIAccessibilityTraitNone),
  @"combobox": @(UIAccessibilityTraitNone),
  @"menu": @(UIAccessibilityTraitNone),
  @"menubar": @(UIAccessibilityTraitNone),
  @"menuitem": @(UIAccessibilityTraitNone),
  @"progressbar": @(UIAccessibilityTraitNone),
  @"radio": @(UIAccessibilityTraitNone),
  @"radiogroup": @(UIAccessibilityTraitNone),
  @"scrollbar": @(UIAccessibilityTraitNone),
  @"spinbutton": @(UIAccessibilityTraitNone),
  @"switch": @(SwitchAccessibilityTrait),
  @"tab": @(UIAccessibilityTraitNone),
  @"tablist": @(UIAccessibilityTraitNone),
  @"timer": @(UIAccessibilityTraitNone),
  @"toolbar": @(UIAccessibilityTraitNone),
}), UIAccessibilityTraitNone, unsignedLongLongValue)

@end

@implementation ABI38_0_0RCTViewManager

@synthesize bridge = _bridge;

ABI38_0_0RCT_EXPORT_MODULE()

- (dispatch_queue_t)methodQueue
{
  return ABI38_0_0RCTGetUIManagerQueue();
}

- (UIView *)view
{
#if TARGET_OS_TV
  return [ABI38_0_0RCTTVView new];
#else
  return [ABI38_0_0RCTView new];
#endif
}

- (ABI38_0_0RCTShadowView *)shadowView
{
  return [ABI38_0_0RCTShadowView new];
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
// TODO: Delete props for Apple TV.
ABI38_0_0RCT_EXPORT_VIEW_PROPERTY(isTVSelectable, BOOL)
ABI38_0_0RCT_EXPORT_VIEW_PROPERTY(hasTVPreferredFocus, BOOL)
ABI38_0_0RCT_EXPORT_VIEW_PROPERTY(tvParallaxProperties, NSDictionary)
#endif

// Accessibility related properties
ABI38_0_0RCT_REMAP_VIEW_PROPERTY(accessible, ABI38_0_0ReactAccessibilityElement.isAccessibilityElement, BOOL)
ABI38_0_0RCT_REMAP_VIEW_PROPERTY(accessibilityActions, ABI38_0_0ReactAccessibilityElement.accessibilityActions, NSDictionaryArray)
ABI38_0_0RCT_REMAP_VIEW_PROPERTY(accessibilityLabel, ABI38_0_0ReactAccessibilityElement.accessibilityLabel, NSString)
ABI38_0_0RCT_REMAP_VIEW_PROPERTY(accessibilityHint, ABI38_0_0ReactAccessibilityElement.accessibilityHint, NSString)
ABI38_0_0RCT_REMAP_VIEW_PROPERTY(accessibilityValue, ABI38_0_0ReactAccessibilityElement.accessibilityValueInternal, NSDictionary)
ABI38_0_0RCT_REMAP_VIEW_PROPERTY(accessibilityViewIsModal, ABI38_0_0ReactAccessibilityElement.accessibilityViewIsModal, BOOL)
ABI38_0_0RCT_REMAP_VIEW_PROPERTY(accessibilityElementsHidden, ABI38_0_0ReactAccessibilityElement.accessibilityElementsHidden, BOOL)
ABI38_0_0RCT_REMAP_VIEW_PROPERTY(accessibilityIgnoresInvertColors, ABI38_0_0ReactAccessibilityElement.shouldAccessibilityIgnoresInvertColors, BOOL)
ABI38_0_0RCT_REMAP_VIEW_PROPERTY(onAccessibilityAction, ABI38_0_0ReactAccessibilityElement.onAccessibilityAction, ABI38_0_0RCTDirectEventBlock)
ABI38_0_0RCT_REMAP_VIEW_PROPERTY(onAccessibilityTap, ABI38_0_0ReactAccessibilityElement.onAccessibilityTap, ABI38_0_0RCTDirectEventBlock)
ABI38_0_0RCT_REMAP_VIEW_PROPERTY(onMagicTap, ABI38_0_0ReactAccessibilityElement.onMagicTap, ABI38_0_0RCTDirectEventBlock)
ABI38_0_0RCT_REMAP_VIEW_PROPERTY(onAccessibilityEscape, ABI38_0_0ReactAccessibilityElement.onAccessibilityEscape, ABI38_0_0RCTDirectEventBlock)
ABI38_0_0RCT_REMAP_VIEW_PROPERTY(testID, ABI38_0_0ReactAccessibilityElement.accessibilityIdentifier, NSString)

ABI38_0_0RCT_EXPORT_VIEW_PROPERTY(backgroundColor, UIColor)
ABI38_0_0RCT_REMAP_VIEW_PROPERTY(backfaceVisibility, layer.doubleSided, css_backface_visibility_t)
ABI38_0_0RCT_REMAP_VIEW_PROPERTY(opacity, alpha, CGFloat)
ABI38_0_0RCT_REMAP_VIEW_PROPERTY(shadowColor, layer.shadowColor, CGColor)
ABI38_0_0RCT_REMAP_VIEW_PROPERTY(shadowOffset, layer.shadowOffset, CGSize)
ABI38_0_0RCT_REMAP_VIEW_PROPERTY(shadowOpacity, layer.shadowOpacity, float)
ABI38_0_0RCT_REMAP_VIEW_PROPERTY(shadowRadius, layer.shadowRadius, CGFloat)
ABI38_0_0RCT_REMAP_VIEW_PROPERTY(needsOffscreenAlphaCompositing, layer.allowsGroupOpacity, BOOL)
ABI38_0_0RCT_CUSTOM_VIEW_PROPERTY(overflow, ABI38_0_0YGOverflow, ABI38_0_0RCTView)
{
  if (json) {
    view.clipsToBounds = [ABI38_0_0RCTConvert ABI38_0_0YGOverflow:json] != ABI38_0_0YGOverflowVisible;
  } else {
    view.clipsToBounds = defaultView.clipsToBounds;
  }
}
ABI38_0_0RCT_CUSTOM_VIEW_PROPERTY(shouldRasterizeIOS, BOOL, ABI38_0_0RCTView)
{
  view.layer.shouldRasterize = json ? [ABI38_0_0RCTConvert BOOL:json] : defaultView.layer.shouldRasterize;
  view.layer.rasterizationScale = view.layer.shouldRasterize ? [UIScreen mainScreen].scale : defaultView.layer.rasterizationScale;
}

ABI38_0_0RCT_CUSTOM_VIEW_PROPERTY(transform, CATransform3D, ABI38_0_0RCTView)
{
  view.layer.transform = json ? [ABI38_0_0RCTConvert CATransform3D:json] : defaultView.layer.transform;
  // Enable edge antialiasing in perspective transforms
  view.layer.allowsEdgeAntialiasing = !(view.layer.transform.m34 == 0.0f);
}

ABI38_0_0RCT_CUSTOM_VIEW_PROPERTY(accessibilityRole, UIAccessibilityTraits, ABI38_0_0RCTView)
{
  const UIAccessibilityTraits AccessibilityRolesMask = UIAccessibilityTraitNone | UIAccessibilityTraitButton | UIAccessibilityTraitLink | UIAccessibilityTraitSearchField | UIAccessibilityTraitImage | UIAccessibilityTraitKeyboardKey | UIAccessibilityTraitStaticText | UIAccessibilityTraitAdjustable | UIAccessibilityTraitHeader | UIAccessibilityTraitSummaryElement | SwitchAccessibilityTrait;
  view.ABI38_0_0ReactAccessibilityElement.accessibilityTraits = view.ABI38_0_0ReactAccessibilityElement.accessibilityTraits & ~AccessibilityRolesMask;
  UIAccessibilityTraits newTraits = json ? [ABI38_0_0RCTConvert UIAccessibilityTraits:json] : defaultView.accessibilityTraits;
  if (newTraits != UIAccessibilityTraitNone) {
    UIAccessibilityTraits maskedTraits = newTraits & AccessibilityRolesMask;
    view.ABI38_0_0ReactAccessibilityElement.accessibilityTraits |= maskedTraits;
  } else {
    NSString *role = json ? [ABI38_0_0RCTConvert NSString:json] : @"";
    view.ABI38_0_0ReactAccessibilityElement.accessibilityRole = role;
  }
}

ABI38_0_0RCT_CUSTOM_VIEW_PROPERTY(accessibilityState, NSDictionary, ABI38_0_0RCTView)
{
  NSDictionary<NSString *, id> *state = json ? [ABI38_0_0RCTConvert NSDictionary:json] : nil;
  NSMutableDictionary<NSString *, id> *newState = [[NSMutableDictionary<NSString *, id> alloc] init];

  if (!state) {
    return;
  }

  const UIAccessibilityTraits AccessibilityStatesMask = UIAccessibilityTraitNotEnabled | UIAccessibilityTraitSelected;
  view.ABI38_0_0ReactAccessibilityElement.accessibilityTraits = view.ABI38_0_0ReactAccessibilityElement.accessibilityTraits & ~AccessibilityStatesMask;

  for (NSString *s in state) {
    id val = [state objectForKey:s];
    if (!val) {
      continue;
    }
    if ([s isEqualToString:@"selected"] && [val isKindOfClass:[NSNumber class]] && [val boolValue]) {
      view.ABI38_0_0ReactAccessibilityElement.accessibilityTraits |= UIAccessibilityTraitSelected;
    } else if ([s isEqualToString:@"disabled"] && [val isKindOfClass:[NSNumber class]] && [val boolValue]) {
      view.ABI38_0_0ReactAccessibilityElement.accessibilityTraits |= UIAccessibilityTraitNotEnabled;
    } else {
      newState[s] = val;
    }
  }
  if (newState.count > 0) {
    view.ABI38_0_0ReactAccessibilityElement.accessibilityState = newState;
    // Post a layout change notification to make sure VoiceOver get notified for the state
    // changes that don't happen upon users' click.
    UIAccessibilityPostNotification(UIAccessibilityLayoutChangedNotification, nil);
  } else {
    view.ABI38_0_0ReactAccessibilityElement.accessibilityState = nil;
  }

}

ABI38_0_0RCT_CUSTOM_VIEW_PROPERTY(nativeID, NSString *, ABI38_0_0RCTView)
{
  view.nativeID = json ? [ABI38_0_0RCTConvert NSString:json] : defaultView.nativeID;
  [_bridge.uiManager setNativeID:view.nativeID forView:view];
}

ABI38_0_0RCT_CUSTOM_VIEW_PROPERTY(pointerEvents, ABI38_0_0RCTPointerEvents, ABI38_0_0RCTView)
{
  if ([view respondsToSelector:@selector(setPointerEvents:)]) {
    view.pointerEvents = json ? [ABI38_0_0RCTConvert ABI38_0_0RCTPointerEvents:json] : defaultView.pointerEvents;
    return;
  }

  if (!json) {
    view.userInteractionEnabled = defaultView.userInteractionEnabled;
    return;
  }

  switch ([ABI38_0_0RCTConvert ABI38_0_0RCTPointerEvents:json]) {
    case ABI38_0_0RCTPointerEventsUnspecified:
      // Pointer events "unspecified" acts as if a stylesheet had not specified,
      // which is different than "auto" in CSS (which cannot and will not be
      // supported in `ABI38_0_0React`. "auto" may override a parent's "none".
      // Unspecified values do not.
      // This wouldn't override a container view's `userInteractionEnabled = NO`
      view.userInteractionEnabled = YES;
    case ABI38_0_0RCTPointerEventsNone:
      view.userInteractionEnabled = NO;
      break;
    default:
      ABI38_0_0RCTLogError(@"UIView base class does not support pointerEvent value: %@", json);
  }
}
ABI38_0_0RCT_CUSTOM_VIEW_PROPERTY(removeClippedSubviews, BOOL, ABI38_0_0RCTView)
{
  if ([view respondsToSelector:@selector(setRemoveClippedSubviews:)]) {
    view.removeClippedSubviews = json ? [ABI38_0_0RCTConvert BOOL:json] : defaultView.removeClippedSubviews;
  }
}
ABI38_0_0RCT_CUSTOM_VIEW_PROPERTY(borderRadius, CGFloat, ABI38_0_0RCTView) {
  if ([view respondsToSelector:@selector(setBorderRadius:)]) {
    view.borderRadius = json ? [ABI38_0_0RCTConvert CGFloat:json] : defaultView.borderRadius;
  } else {
    view.layer.cornerRadius = json ? [ABI38_0_0RCTConvert CGFloat:json] : defaultView.layer.cornerRadius;
  }
}
ABI38_0_0RCT_CUSTOM_VIEW_PROPERTY(borderColor, CGColor, ABI38_0_0RCTView)
{
  if ([view respondsToSelector:@selector(setBorderColor:)]) {
    view.borderColor = json ? [ABI38_0_0RCTConvert CGColor:json] : defaultView.borderColor;
  } else {
    view.layer.borderColor = json ? [ABI38_0_0RCTConvert CGColor:json] : defaultView.layer.borderColor;
  }
}
ABI38_0_0RCT_CUSTOM_VIEW_PROPERTY(borderWidth, float, ABI38_0_0RCTView)
{
  if ([view respondsToSelector:@selector(setBorderWidth:)]) {
    view.borderWidth = json ? [ABI38_0_0RCTConvert CGFloat:json] : defaultView.borderWidth;
  } else {
    view.layer.borderWidth = json ? [ABI38_0_0RCTConvert CGFloat:json] : defaultView.layer.borderWidth;
  }
}
ABI38_0_0RCT_CUSTOM_VIEW_PROPERTY(borderStyle, ABI38_0_0RCTBorderStyle, ABI38_0_0RCTView)
{
  if ([view respondsToSelector:@selector(setBorderStyle:)]) {
    view.borderStyle = json ? [ABI38_0_0RCTConvert ABI38_0_0RCTBorderStyle:json] : defaultView.borderStyle;
  }
}
ABI38_0_0RCT_CUSTOM_VIEW_PROPERTY(hitSlop, UIEdgeInsets, ABI38_0_0RCTView)
{
  if ([view respondsToSelector:@selector(setHitTestEdgeInsets:)]) {
    if (json) {
      UIEdgeInsets hitSlopInsets = [ABI38_0_0RCTConvert UIEdgeInsets:json];
      view.hitTestEdgeInsets = UIEdgeInsetsMake(-hitSlopInsets.top, -hitSlopInsets.left, -hitSlopInsets.bottom, -hitSlopInsets.right);
    } else {
      view.hitTestEdgeInsets = defaultView.hitTestEdgeInsets;
    }
  }
}

#define ABI38_0_0RCT_VIEW_BORDER_PROPERTY(SIDE)                                  \
ABI38_0_0RCT_CUSTOM_VIEW_PROPERTY(border##SIDE##Width, float, ABI38_0_0RCTView)           \
{                                                                       \
  if ([view respondsToSelector:@selector(setBorder##SIDE##Width:)]) {   \
    view.border##SIDE##Width = json ? [ABI38_0_0RCTConvert CGFloat:json] : defaultView.border##SIDE##Width; \
  }                                                                     \
}                                                                       \
ABI38_0_0RCT_CUSTOM_VIEW_PROPERTY(border##SIDE##Color, UIColor, ABI38_0_0RCTView)         \
{                                                                       \
  if ([view respondsToSelector:@selector(setBorder##SIDE##Color:)]) {   \
    view.border##SIDE##Color = json ? [ABI38_0_0RCTConvert CGColor:json] : defaultView.border##SIDE##Color; \
  }                                                                     \
}

ABI38_0_0RCT_VIEW_BORDER_PROPERTY(Top)
ABI38_0_0RCT_VIEW_BORDER_PROPERTY(Right)
ABI38_0_0RCT_VIEW_BORDER_PROPERTY(Bottom)
ABI38_0_0RCT_VIEW_BORDER_PROPERTY(Left)
ABI38_0_0RCT_VIEW_BORDER_PROPERTY(Start)
ABI38_0_0RCT_VIEW_BORDER_PROPERTY(End)

#define ABI38_0_0RCT_VIEW_BORDER_RADIUS_PROPERTY(SIDE)                           \
ABI38_0_0RCT_CUSTOM_VIEW_PROPERTY(border##SIDE##Radius, CGFloat, ABI38_0_0RCTView)        \
{                                                                       \
  if ([view respondsToSelector:@selector(setBorder##SIDE##Radius:)]) {  \
    view.border##SIDE##Radius = json ? [ABI38_0_0RCTConvert CGFloat:json] : defaultView.border##SIDE##Radius; \
  }                                                                     \
}                                                                       \

ABI38_0_0RCT_VIEW_BORDER_RADIUS_PROPERTY(TopLeft)
ABI38_0_0RCT_VIEW_BORDER_RADIUS_PROPERTY(TopRight)
ABI38_0_0RCT_VIEW_BORDER_RADIUS_PROPERTY(TopStart)
ABI38_0_0RCT_VIEW_BORDER_RADIUS_PROPERTY(TopEnd)
ABI38_0_0RCT_VIEW_BORDER_RADIUS_PROPERTY(BottomLeft)
ABI38_0_0RCT_VIEW_BORDER_RADIUS_PROPERTY(BottomRight)
ABI38_0_0RCT_VIEW_BORDER_RADIUS_PROPERTY(BottomStart)
ABI38_0_0RCT_VIEW_BORDER_RADIUS_PROPERTY(BottomEnd)

ABI38_0_0RCT_REMAP_VIEW_PROPERTY(display, ABI38_0_0ReactDisplay, ABI38_0_0YGDisplay)
ABI38_0_0RCT_REMAP_VIEW_PROPERTY(zIndex, ABI38_0_0ReactZIndex, NSInteger)

#pragma mark - ShadowView properties

ABI38_0_0RCT_EXPORT_SHADOW_PROPERTY(top, ABI38_0_0YGValue)
ABI38_0_0RCT_EXPORT_SHADOW_PROPERTY(right, ABI38_0_0YGValue)
ABI38_0_0RCT_EXPORT_SHADOW_PROPERTY(start, ABI38_0_0YGValue)
ABI38_0_0RCT_EXPORT_SHADOW_PROPERTY(end, ABI38_0_0YGValue)
ABI38_0_0RCT_EXPORT_SHADOW_PROPERTY(bottom, ABI38_0_0YGValue)
ABI38_0_0RCT_EXPORT_SHADOW_PROPERTY(left, ABI38_0_0YGValue)

ABI38_0_0RCT_EXPORT_SHADOW_PROPERTY(width, ABI38_0_0YGValue)
ABI38_0_0RCT_EXPORT_SHADOW_PROPERTY(height, ABI38_0_0YGValue)

ABI38_0_0RCT_EXPORT_SHADOW_PROPERTY(minWidth, ABI38_0_0YGValue)
ABI38_0_0RCT_EXPORT_SHADOW_PROPERTY(maxWidth, ABI38_0_0YGValue)
ABI38_0_0RCT_EXPORT_SHADOW_PROPERTY(minHeight, ABI38_0_0YGValue)
ABI38_0_0RCT_EXPORT_SHADOW_PROPERTY(maxHeight, ABI38_0_0YGValue)

ABI38_0_0RCT_EXPORT_SHADOW_PROPERTY(borderTopWidth, float)
ABI38_0_0RCT_EXPORT_SHADOW_PROPERTY(borderRightWidth, float)
ABI38_0_0RCT_EXPORT_SHADOW_PROPERTY(borderBottomWidth, float)
ABI38_0_0RCT_EXPORT_SHADOW_PROPERTY(borderLeftWidth, float)
ABI38_0_0RCT_EXPORT_SHADOW_PROPERTY(borderStartWidth, float)
ABI38_0_0RCT_EXPORT_SHADOW_PROPERTY(borderEndWidth, float)
ABI38_0_0RCT_EXPORT_SHADOW_PROPERTY(borderWidth, float)

ABI38_0_0RCT_EXPORT_SHADOW_PROPERTY(marginTop, ABI38_0_0YGValue)
ABI38_0_0RCT_EXPORT_SHADOW_PROPERTY(marginRight, ABI38_0_0YGValue)
ABI38_0_0RCT_EXPORT_SHADOW_PROPERTY(marginBottom, ABI38_0_0YGValue)
ABI38_0_0RCT_EXPORT_SHADOW_PROPERTY(marginLeft, ABI38_0_0YGValue)
ABI38_0_0RCT_EXPORT_SHADOW_PROPERTY(marginStart, ABI38_0_0YGValue)
ABI38_0_0RCT_EXPORT_SHADOW_PROPERTY(marginEnd, ABI38_0_0YGValue)
ABI38_0_0RCT_EXPORT_SHADOW_PROPERTY(marginVertical, ABI38_0_0YGValue)
ABI38_0_0RCT_EXPORT_SHADOW_PROPERTY(marginHorizontal, ABI38_0_0YGValue)
ABI38_0_0RCT_EXPORT_SHADOW_PROPERTY(margin, ABI38_0_0YGValue)

ABI38_0_0RCT_EXPORT_SHADOW_PROPERTY(paddingTop, ABI38_0_0YGValue)
ABI38_0_0RCT_EXPORT_SHADOW_PROPERTY(paddingRight, ABI38_0_0YGValue)
ABI38_0_0RCT_EXPORT_SHADOW_PROPERTY(paddingBottom, ABI38_0_0YGValue)
ABI38_0_0RCT_EXPORT_SHADOW_PROPERTY(paddingLeft, ABI38_0_0YGValue)
ABI38_0_0RCT_EXPORT_SHADOW_PROPERTY(paddingStart, ABI38_0_0YGValue)
ABI38_0_0RCT_EXPORT_SHADOW_PROPERTY(paddingEnd, ABI38_0_0YGValue)
ABI38_0_0RCT_EXPORT_SHADOW_PROPERTY(paddingVertical, ABI38_0_0YGValue)
ABI38_0_0RCT_EXPORT_SHADOW_PROPERTY(paddingHorizontal, ABI38_0_0YGValue)
ABI38_0_0RCT_EXPORT_SHADOW_PROPERTY(padding, ABI38_0_0YGValue)

ABI38_0_0RCT_EXPORT_SHADOW_PROPERTY(flex, float)
ABI38_0_0RCT_EXPORT_SHADOW_PROPERTY(flexGrow, float)
ABI38_0_0RCT_EXPORT_SHADOW_PROPERTY(flexShrink, float)
ABI38_0_0RCT_EXPORT_SHADOW_PROPERTY(flexBasis, ABI38_0_0YGValue)
ABI38_0_0RCT_EXPORT_SHADOW_PROPERTY(flexDirection, ABI38_0_0YGFlexDirection)
ABI38_0_0RCT_EXPORT_SHADOW_PROPERTY(flexWrap, ABI38_0_0YGWrap)
ABI38_0_0RCT_EXPORT_SHADOW_PROPERTY(justifyContent, ABI38_0_0YGJustify)
ABI38_0_0RCT_EXPORT_SHADOW_PROPERTY(alignItems, ABI38_0_0YGAlign)
ABI38_0_0RCT_EXPORT_SHADOW_PROPERTY(alignSelf, ABI38_0_0YGAlign)
ABI38_0_0RCT_EXPORT_SHADOW_PROPERTY(alignContent, ABI38_0_0YGAlign)
ABI38_0_0RCT_EXPORT_SHADOW_PROPERTY(position, ABI38_0_0YGPositionType)
ABI38_0_0RCT_EXPORT_SHADOW_PROPERTY(aspectRatio, float)

ABI38_0_0RCT_EXPORT_SHADOW_PROPERTY(overflow, ABI38_0_0YGOverflow)
ABI38_0_0RCT_EXPORT_SHADOW_PROPERTY(display, ABI38_0_0YGDisplay)

ABI38_0_0RCT_EXPORT_SHADOW_PROPERTY(onLayout, ABI38_0_0RCTDirectEventBlock)

ABI38_0_0RCT_EXPORT_SHADOW_PROPERTY(direction, ABI38_0_0YGDirection)

@end
