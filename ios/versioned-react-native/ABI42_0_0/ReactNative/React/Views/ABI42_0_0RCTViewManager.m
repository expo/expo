/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "ABI42_0_0RCTViewManager.h"

#import "ABI42_0_0RCTBorderStyle.h"
#import "ABI42_0_0RCTBridge.h"
#import "ABI42_0_0RCTConvert+Transform.h"
#import "ABI42_0_0RCTConvert.h"
#import "ABI42_0_0RCTEventDispatcher.h"
#import "ABI42_0_0RCTLog.h"
#import "ABI42_0_0RCTShadowView.h"
#import "ABI42_0_0RCTUIManager.h"
#import "ABI42_0_0RCTUIManagerUtils.h"
#import "ABI42_0_0RCTUtils.h"
#import "ABI42_0_0RCTView.h"
#import "ABI42_0_0UIView+React.h"

#if TARGET_OS_TV
#import "ABI42_0_0RCTTVView.h"
#endif

@implementation ABI42_0_0RCTConvert (UIAccessibilityTraits)

ABI42_0_0RCT_MULTI_ENUM_CONVERTER(
    UIAccessibilityTraits,
    (@{
      @"none" : @(UIAccessibilityTraitNone),
      @"button" : @(UIAccessibilityTraitButton),
      @"link" : @(UIAccessibilityTraitLink),
      @"header" : @(UIAccessibilityTraitHeader),
      @"search" : @(UIAccessibilityTraitSearchField),
      @"image" : @(UIAccessibilityTraitImage),
      @"imagebutton" : @(UIAccessibilityTraitImage | UIAccessibilityTraitButton),
      @"selected" : @(UIAccessibilityTraitSelected),
      @"plays" : @(UIAccessibilityTraitPlaysSound),
      @"key" : @(UIAccessibilityTraitKeyboardKey),
      @"keyboardkey" : @(UIAccessibilityTraitKeyboardKey),
      @"text" : @(UIAccessibilityTraitStaticText),
      @"summary" : @(UIAccessibilityTraitSummaryElement),
      @"disabled" : @(UIAccessibilityTraitNotEnabled),
      @"frequentUpdates" : @(UIAccessibilityTraitUpdatesFrequently),
      @"startsMedia" : @(UIAccessibilityTraitStartsMediaSession),
      @"adjustable" : @(UIAccessibilityTraitAdjustable),
      @"allowsDirectInteraction" : @(UIAccessibilityTraitAllowsDirectInteraction),
      @"pageTurn" : @(UIAccessibilityTraitCausesPageTurn),
      @"alert" : @(UIAccessibilityTraitNone),
      @"checkbox" : @(UIAccessibilityTraitNone),
      @"combobox" : @(UIAccessibilityTraitNone),
      @"menu" : @(UIAccessibilityTraitNone),
      @"menubar" : @(UIAccessibilityTraitNone),
      @"menuitem" : @(UIAccessibilityTraitNone),
      @"progressbar" : @(UIAccessibilityTraitNone),
      @"radio" : @(UIAccessibilityTraitNone),
      @"radiogroup" : @(UIAccessibilityTraitNone),
      @"scrollbar" : @(UIAccessibilityTraitNone),
      @"spinbutton" : @(UIAccessibilityTraitNone),
      @"switch" : @(SwitchAccessibilityTrait),
      @"tab" : @(UIAccessibilityTraitNone),
      @"tablist" : @(UIAccessibilityTraitNone),
      @"timer" : @(UIAccessibilityTraitNone),
      @"toolbar" : @(UIAccessibilityTraitNone),
    }),
    UIAccessibilityTraitNone,
    unsignedLongLongValue)

@end

@implementation ABI42_0_0RCTViewManager

@synthesize bridge = _bridge;

ABI42_0_0RCT_EXPORT_MODULE()

- (dispatch_queue_t)methodQueue
{
  return ABI42_0_0RCTGetUIManagerQueue();
}

- (UIView *)view
{
#if TARGET_OS_TV
  return [ABI42_0_0RCTTVView new];
#else
  return [ABI42_0_0RCTView new];
#endif
}

- (ABI42_0_0RCTShadowView *)shadowView
{
  return [ABI42_0_0RCTShadowView new];
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
ABI42_0_0RCT_EXPORT_VIEW_PROPERTY(isTVSelectable, BOOL)
ABI42_0_0RCT_EXPORT_VIEW_PROPERTY(hasTVPreferredFocus, BOOL)
ABI42_0_0RCT_EXPORT_VIEW_PROPERTY(tvParallaxProperties, NSDictionary)
#endif

// Accessibility related properties
ABI42_0_0RCT_REMAP_VIEW_PROPERTY(accessible, ABI42_0_0ReactAccessibilityElement.isAccessibilityElement, BOOL)
ABI42_0_0RCT_REMAP_VIEW_PROPERTY(accessibilityActions, ABI42_0_0ReactAccessibilityElement.accessibilityActions, NSDictionaryArray)
ABI42_0_0RCT_REMAP_VIEW_PROPERTY(accessibilityLabel, ABI42_0_0ReactAccessibilityElement.accessibilityLabel, NSString)
ABI42_0_0RCT_REMAP_VIEW_PROPERTY(accessibilityHint, ABI42_0_0ReactAccessibilityElement.accessibilityHint, NSString)
ABI42_0_0RCT_REMAP_VIEW_PROPERTY(accessibilityValue, ABI42_0_0ReactAccessibilityElement.accessibilityValueInternal, NSDictionary)
ABI42_0_0RCT_REMAP_VIEW_PROPERTY(accessibilityViewIsModal, ABI42_0_0ReactAccessibilityElement.accessibilityViewIsModal, BOOL)
ABI42_0_0RCT_REMAP_VIEW_PROPERTY(accessibilityElementsHidden, ABI42_0_0ReactAccessibilityElement.accessibilityElementsHidden, BOOL)
ABI42_0_0RCT_REMAP_VIEW_PROPERTY(
    accessibilityIgnoresInvertColors,
    ABI42_0_0ReactAccessibilityElement.shouldAccessibilityIgnoresInvertColors,
    BOOL)
ABI42_0_0RCT_REMAP_VIEW_PROPERTY(onAccessibilityAction, ABI42_0_0ReactAccessibilityElement.onAccessibilityAction, ABI42_0_0RCTDirectEventBlock)
ABI42_0_0RCT_REMAP_VIEW_PROPERTY(onAccessibilityTap, ABI42_0_0ReactAccessibilityElement.onAccessibilityTap, ABI42_0_0RCTDirectEventBlock)
ABI42_0_0RCT_REMAP_VIEW_PROPERTY(onMagicTap, ABI42_0_0ReactAccessibilityElement.onMagicTap, ABI42_0_0RCTDirectEventBlock)
ABI42_0_0RCT_REMAP_VIEW_PROPERTY(onAccessibilityEscape, ABI42_0_0ReactAccessibilityElement.onAccessibilityEscape, ABI42_0_0RCTDirectEventBlock)
ABI42_0_0RCT_REMAP_VIEW_PROPERTY(testID, ABI42_0_0ReactAccessibilityElement.accessibilityIdentifier, NSString)

ABI42_0_0RCT_EXPORT_VIEW_PROPERTY(backgroundColor, UIColor)
ABI42_0_0RCT_REMAP_VIEW_PROPERTY(backfaceVisibility, layer.doubleSided, css_backface_visibility_t)
ABI42_0_0RCT_REMAP_VIEW_PROPERTY(opacity, alpha, CGFloat)
ABI42_0_0RCT_REMAP_VIEW_PROPERTY(shadowColor, layer.shadowColor, CGColor)
ABI42_0_0RCT_REMAP_VIEW_PROPERTY(shadowOffset, layer.shadowOffset, CGSize)
ABI42_0_0RCT_REMAP_VIEW_PROPERTY(shadowOpacity, layer.shadowOpacity, float)
ABI42_0_0RCT_REMAP_VIEW_PROPERTY(shadowRadius, layer.shadowRadius, CGFloat)
ABI42_0_0RCT_REMAP_VIEW_PROPERTY(needsOffscreenAlphaCompositing, layer.allowsGroupOpacity, BOOL)
ABI42_0_0RCT_CUSTOM_VIEW_PROPERTY(overflow, ABI42_0_0YGOverflow, ABI42_0_0RCTView)
{
  if (json) {
    view.clipsToBounds = [ABI42_0_0RCTConvert ABI42_0_0YGOverflow:json] != ABI42_0_0YGOverflowVisible;
  } else {
    view.clipsToBounds = defaultView.clipsToBounds;
  }
}
ABI42_0_0RCT_CUSTOM_VIEW_PROPERTY(shouldRasterizeIOS, BOOL, ABI42_0_0RCTView)
{
  view.layer.shouldRasterize = json ? [ABI42_0_0RCTConvert BOOL:json] : defaultView.layer.shouldRasterize;
  view.layer.rasterizationScale =
      view.layer.shouldRasterize ? [UIScreen mainScreen].scale : defaultView.layer.rasterizationScale;
}

ABI42_0_0RCT_CUSTOM_VIEW_PROPERTY(transform, CATransform3D, ABI42_0_0RCTView)
{
  view.layer.transform = json ? [ABI42_0_0RCTConvert CATransform3D:json] : defaultView.layer.transform;
  // Enable edge antialiasing in perspective transforms
  view.layer.allowsEdgeAntialiasing = !(view.layer.transform.m34 == 0.0f);
}

ABI42_0_0RCT_CUSTOM_VIEW_PROPERTY(accessibilityRole, UIAccessibilityTraits, ABI42_0_0RCTView)
{
  const UIAccessibilityTraits AccessibilityRolesMask = UIAccessibilityTraitNone | UIAccessibilityTraitButton |
      UIAccessibilityTraitLink | UIAccessibilityTraitSearchField | UIAccessibilityTraitImage |
      UIAccessibilityTraitKeyboardKey | UIAccessibilityTraitStaticText | UIAccessibilityTraitAdjustable |
      UIAccessibilityTraitHeader | UIAccessibilityTraitSummaryElement | SwitchAccessibilityTrait;
  view.ABI42_0_0ReactAccessibilityElement.accessibilityTraits =
      view.ABI42_0_0ReactAccessibilityElement.accessibilityTraits & ~AccessibilityRolesMask;
  UIAccessibilityTraits newTraits = json ? [ABI42_0_0RCTConvert UIAccessibilityTraits:json] : defaultView.accessibilityTraits;
  if (newTraits != UIAccessibilityTraitNone) {
    UIAccessibilityTraits maskedTraits = newTraits & AccessibilityRolesMask;
    view.ABI42_0_0ReactAccessibilityElement.accessibilityTraits |= maskedTraits;
  } else {
    NSString *role = json ? [ABI42_0_0RCTConvert NSString:json] : @"";
    view.ABI42_0_0ReactAccessibilityElement.accessibilityRole = role;
  }
}

ABI42_0_0RCT_CUSTOM_VIEW_PROPERTY(accessibilityState, NSDictionary, ABI42_0_0RCTView)
{
  NSDictionary<NSString *, id> *state = json ? [ABI42_0_0RCTConvert NSDictionary:json] : nil;
  NSMutableDictionary<NSString *, id> *newState = [[NSMutableDictionary<NSString *, id> alloc] init];

  if (!state) {
    return;
  }

  const UIAccessibilityTraits AccessibilityStatesMask = UIAccessibilityTraitNotEnabled | UIAccessibilityTraitSelected;
  view.ABI42_0_0ReactAccessibilityElement.accessibilityTraits =
      view.ABI42_0_0ReactAccessibilityElement.accessibilityTraits & ~AccessibilityStatesMask;

  for (NSString *s in state) {
    id val = [state objectForKey:s];
    if (!val) {
      continue;
    }
    if ([s isEqualToString:@"selected"] && [val isKindOfClass:[NSNumber class]] && [val boolValue]) {
      view.ABI42_0_0ReactAccessibilityElement.accessibilityTraits |= UIAccessibilityTraitSelected;
    } else if ([s isEqualToString:@"disabled"] && [val isKindOfClass:[NSNumber class]] && [val boolValue]) {
      view.ABI42_0_0ReactAccessibilityElement.accessibilityTraits |= UIAccessibilityTraitNotEnabled;
    } else {
      newState[s] = val;
    }
  }
  if (newState.count > 0) {
    view.ABI42_0_0ReactAccessibilityElement.accessibilityState = newState;
    // Post a layout change notification to make sure VoiceOver get notified for the state
    // changes that don't happen upon users' click.
    UIAccessibilityPostNotification(UIAccessibilityLayoutChangedNotification, nil);
  } else {
    view.ABI42_0_0ReactAccessibilityElement.accessibilityState = nil;
  }
}

ABI42_0_0RCT_CUSTOM_VIEW_PROPERTY(nativeID, NSString *, ABI42_0_0RCTView)
{
  view.nativeID = json ? [ABI42_0_0RCTConvert NSString:json] : defaultView.nativeID;
  [_bridge.uiManager setNativeID:view.nativeID forView:view];
}

ABI42_0_0RCT_CUSTOM_VIEW_PROPERTY(pointerEvents, ABI42_0_0RCTPointerEvents, ABI42_0_0RCTView)
{
  if ([view respondsToSelector:@selector(setPointerEvents:)]) {
    view.pointerEvents = json ? [ABI42_0_0RCTConvert ABI42_0_0RCTPointerEvents:json] : defaultView.pointerEvents;
    return;
  }

  if (!json) {
    view.userInteractionEnabled = defaultView.userInteractionEnabled;
    return;
  }

  switch ([ABI42_0_0RCTConvert ABI42_0_0RCTPointerEvents:json]) {
    case ABI42_0_0RCTPointerEventsUnspecified:
      // Pointer events "unspecified" acts as if a stylesheet had not specified,
      // which is different than "auto" in CSS (which cannot and will not be
      // supported in `ABI42_0_0React`. "auto" may override a parent's "none".
      // Unspecified values do not.
      // This wouldn't override a container view's `userInteractionEnabled = NO`
      view.userInteractionEnabled = YES;
    case ABI42_0_0RCTPointerEventsNone:
      view.userInteractionEnabled = NO;
      break;
    default:
      ABI42_0_0RCTLogError(@"UIView base class does not support pointerEvent value: %@", json);
  }
}
ABI42_0_0RCT_CUSTOM_VIEW_PROPERTY(removeClippedSubviews, BOOL, ABI42_0_0RCTView)
{
  if ([view respondsToSelector:@selector(setRemoveClippedSubviews:)]) {
    view.removeClippedSubviews = json ? [ABI42_0_0RCTConvert BOOL:json] : defaultView.removeClippedSubviews;
  }
}
ABI42_0_0RCT_CUSTOM_VIEW_PROPERTY(borderRadius, CGFloat, ABI42_0_0RCTView)
{
  if ([view respondsToSelector:@selector(setBorderRadius:)]) {
    view.borderRadius = json ? [ABI42_0_0RCTConvert CGFloat:json] : defaultView.borderRadius;
  } else {
    view.layer.cornerRadius = json ? [ABI42_0_0RCTConvert CGFloat:json] : defaultView.layer.cornerRadius;
  }
}
ABI42_0_0RCT_CUSTOM_VIEW_PROPERTY(borderColor, CGColor, ABI42_0_0RCTView)
{
  if ([view respondsToSelector:@selector(setBorderColor:)]) {
    view.borderColor = json ? [ABI42_0_0RCTConvert CGColor:json] : defaultView.borderColor;
  } else {
    view.layer.borderColor = json ? [ABI42_0_0RCTConvert CGColor:json] : defaultView.layer.borderColor;
  }
}
ABI42_0_0RCT_CUSTOM_VIEW_PROPERTY(borderWidth, float, ABI42_0_0RCTView)
{
  if ([view respondsToSelector:@selector(setBorderWidth:)]) {
    view.borderWidth = json ? [ABI42_0_0RCTConvert CGFloat:json] : defaultView.borderWidth;
  } else {
    view.layer.borderWidth = json ? [ABI42_0_0RCTConvert CGFloat:json] : defaultView.layer.borderWidth;
  }
}
ABI42_0_0RCT_CUSTOM_VIEW_PROPERTY(borderStyle, ABI42_0_0RCTBorderStyle, ABI42_0_0RCTView)
{
  if ([view respondsToSelector:@selector(setBorderStyle:)]) {
    view.borderStyle = json ? [ABI42_0_0RCTConvert ABI42_0_0RCTBorderStyle:json] : defaultView.borderStyle;
  }
}
ABI42_0_0RCT_CUSTOM_VIEW_PROPERTY(hitSlop, UIEdgeInsets, ABI42_0_0RCTView)
{
  if ([view respondsToSelector:@selector(setHitTestEdgeInsets:)]) {
    if (json) {
      UIEdgeInsets hitSlopInsets = [ABI42_0_0RCTConvert UIEdgeInsets:json];
      view.hitTestEdgeInsets =
          UIEdgeInsetsMake(-hitSlopInsets.top, -hitSlopInsets.left, -hitSlopInsets.bottom, -hitSlopInsets.right);
    } else {
      view.hitTestEdgeInsets = defaultView.hitTestEdgeInsets;
    }
  }
}

#define ABI42_0_0RCT_VIEW_BORDER_PROPERTY(SIDE)                                                               \
  ABI42_0_0RCT_CUSTOM_VIEW_PROPERTY(border##SIDE##Width, float, ABI42_0_0RCTView)                                      \
  {                                                                                                  \
    if ([view respondsToSelector:@selector(setBorder##SIDE##Width:)]) {                              \
      view.border##SIDE##Width = json ? [ABI42_0_0RCTConvert CGFloat:json] : defaultView.border##SIDE##Width; \
    }                                                                                                \
  }                                                                                                  \
  ABI42_0_0RCT_CUSTOM_VIEW_PROPERTY(border##SIDE##Color, UIColor, ABI42_0_0RCTView)                                    \
  {                                                                                                  \
    if ([view respondsToSelector:@selector(setBorder##SIDE##Color:)]) {                              \
      view.border##SIDE##Color = json ? [ABI42_0_0RCTConvert CGColor:json] : defaultView.border##SIDE##Color; \
    }                                                                                                \
  }

ABI42_0_0RCT_VIEW_BORDER_PROPERTY(Top)
ABI42_0_0RCT_VIEW_BORDER_PROPERTY(Right)
ABI42_0_0RCT_VIEW_BORDER_PROPERTY(Bottom)
ABI42_0_0RCT_VIEW_BORDER_PROPERTY(Left)
ABI42_0_0RCT_VIEW_BORDER_PROPERTY(Start)
ABI42_0_0RCT_VIEW_BORDER_PROPERTY(End)

#define ABI42_0_0RCT_VIEW_BORDER_RADIUS_PROPERTY(SIDE)                                                          \
  ABI42_0_0RCT_CUSTOM_VIEW_PROPERTY(border##SIDE##Radius, CGFloat, ABI42_0_0RCTView)                                     \
  {                                                                                                    \
    if ([view respondsToSelector:@selector(setBorder##SIDE##Radius:)]) {                               \
      view.border##SIDE##Radius = json ? [ABI42_0_0RCTConvert CGFloat:json] : defaultView.border##SIDE##Radius; \
    }                                                                                                  \
  }

ABI42_0_0RCT_VIEW_BORDER_RADIUS_PROPERTY(TopLeft)
ABI42_0_0RCT_VIEW_BORDER_RADIUS_PROPERTY(TopRight)
ABI42_0_0RCT_VIEW_BORDER_RADIUS_PROPERTY(TopStart)
ABI42_0_0RCT_VIEW_BORDER_RADIUS_PROPERTY(TopEnd)
ABI42_0_0RCT_VIEW_BORDER_RADIUS_PROPERTY(BottomLeft)
ABI42_0_0RCT_VIEW_BORDER_RADIUS_PROPERTY(BottomRight)
ABI42_0_0RCT_VIEW_BORDER_RADIUS_PROPERTY(BottomStart)
ABI42_0_0RCT_VIEW_BORDER_RADIUS_PROPERTY(BottomEnd)

ABI42_0_0RCT_REMAP_VIEW_PROPERTY(display, ABI42_0_0ReactDisplay, ABI42_0_0YGDisplay)
ABI42_0_0RCT_REMAP_VIEW_PROPERTY(zIndex, ABI42_0_0ReactZIndex, NSInteger)

#pragma mark - ShadowView properties

ABI42_0_0RCT_EXPORT_SHADOW_PROPERTY(top, ABI42_0_0YGValue)
ABI42_0_0RCT_EXPORT_SHADOW_PROPERTY(right, ABI42_0_0YGValue)
ABI42_0_0RCT_EXPORT_SHADOW_PROPERTY(start, ABI42_0_0YGValue)
ABI42_0_0RCT_EXPORT_SHADOW_PROPERTY(end, ABI42_0_0YGValue)
ABI42_0_0RCT_EXPORT_SHADOW_PROPERTY(bottom, ABI42_0_0YGValue)
ABI42_0_0RCT_EXPORT_SHADOW_PROPERTY(left, ABI42_0_0YGValue)

ABI42_0_0RCT_EXPORT_SHADOW_PROPERTY(width, ABI42_0_0YGValue)
ABI42_0_0RCT_EXPORT_SHADOW_PROPERTY(height, ABI42_0_0YGValue)

ABI42_0_0RCT_EXPORT_SHADOW_PROPERTY(minWidth, ABI42_0_0YGValue)
ABI42_0_0RCT_EXPORT_SHADOW_PROPERTY(maxWidth, ABI42_0_0YGValue)
ABI42_0_0RCT_EXPORT_SHADOW_PROPERTY(minHeight, ABI42_0_0YGValue)
ABI42_0_0RCT_EXPORT_SHADOW_PROPERTY(maxHeight, ABI42_0_0YGValue)

ABI42_0_0RCT_EXPORT_SHADOW_PROPERTY(borderTopWidth, float)
ABI42_0_0RCT_EXPORT_SHADOW_PROPERTY(borderRightWidth, float)
ABI42_0_0RCT_EXPORT_SHADOW_PROPERTY(borderBottomWidth, float)
ABI42_0_0RCT_EXPORT_SHADOW_PROPERTY(borderLeftWidth, float)
ABI42_0_0RCT_EXPORT_SHADOW_PROPERTY(borderStartWidth, float)
ABI42_0_0RCT_EXPORT_SHADOW_PROPERTY(borderEndWidth, float)
ABI42_0_0RCT_EXPORT_SHADOW_PROPERTY(borderWidth, float)

ABI42_0_0RCT_EXPORT_SHADOW_PROPERTY(marginTop, ABI42_0_0YGValue)
ABI42_0_0RCT_EXPORT_SHADOW_PROPERTY(marginRight, ABI42_0_0YGValue)
ABI42_0_0RCT_EXPORT_SHADOW_PROPERTY(marginBottom, ABI42_0_0YGValue)
ABI42_0_0RCT_EXPORT_SHADOW_PROPERTY(marginLeft, ABI42_0_0YGValue)
ABI42_0_0RCT_EXPORT_SHADOW_PROPERTY(marginStart, ABI42_0_0YGValue)
ABI42_0_0RCT_EXPORT_SHADOW_PROPERTY(marginEnd, ABI42_0_0YGValue)
ABI42_0_0RCT_EXPORT_SHADOW_PROPERTY(marginVertical, ABI42_0_0YGValue)
ABI42_0_0RCT_EXPORT_SHADOW_PROPERTY(marginHorizontal, ABI42_0_0YGValue)
ABI42_0_0RCT_EXPORT_SHADOW_PROPERTY(margin, ABI42_0_0YGValue)

ABI42_0_0RCT_EXPORT_SHADOW_PROPERTY(paddingTop, ABI42_0_0YGValue)
ABI42_0_0RCT_EXPORT_SHADOW_PROPERTY(paddingRight, ABI42_0_0YGValue)
ABI42_0_0RCT_EXPORT_SHADOW_PROPERTY(paddingBottom, ABI42_0_0YGValue)
ABI42_0_0RCT_EXPORT_SHADOW_PROPERTY(paddingLeft, ABI42_0_0YGValue)
ABI42_0_0RCT_EXPORT_SHADOW_PROPERTY(paddingStart, ABI42_0_0YGValue)
ABI42_0_0RCT_EXPORT_SHADOW_PROPERTY(paddingEnd, ABI42_0_0YGValue)
ABI42_0_0RCT_EXPORT_SHADOW_PROPERTY(paddingVertical, ABI42_0_0YGValue)
ABI42_0_0RCT_EXPORT_SHADOW_PROPERTY(paddingHorizontal, ABI42_0_0YGValue)
ABI42_0_0RCT_EXPORT_SHADOW_PROPERTY(padding, ABI42_0_0YGValue)

ABI42_0_0RCT_EXPORT_SHADOW_PROPERTY(flex, float)
ABI42_0_0RCT_EXPORT_SHADOW_PROPERTY(flexGrow, float)
ABI42_0_0RCT_EXPORT_SHADOW_PROPERTY(flexShrink, float)
ABI42_0_0RCT_EXPORT_SHADOW_PROPERTY(flexBasis, ABI42_0_0YGValue)
ABI42_0_0RCT_EXPORT_SHADOW_PROPERTY(flexDirection, ABI42_0_0YGFlexDirection)
ABI42_0_0RCT_EXPORT_SHADOW_PROPERTY(flexWrap, ABI42_0_0YGWrap)
ABI42_0_0RCT_EXPORT_SHADOW_PROPERTY(justifyContent, ABI42_0_0YGJustify)
ABI42_0_0RCT_EXPORT_SHADOW_PROPERTY(alignItems, ABI42_0_0YGAlign)
ABI42_0_0RCT_EXPORT_SHADOW_PROPERTY(alignSelf, ABI42_0_0YGAlign)
ABI42_0_0RCT_EXPORT_SHADOW_PROPERTY(alignContent, ABI42_0_0YGAlign)
ABI42_0_0RCT_EXPORT_SHADOW_PROPERTY(position, ABI42_0_0YGPositionType)
ABI42_0_0RCT_EXPORT_SHADOW_PROPERTY(aspectRatio, float)

ABI42_0_0RCT_EXPORT_SHADOW_PROPERTY(overflow, ABI42_0_0YGOverflow)
ABI42_0_0RCT_EXPORT_SHADOW_PROPERTY(display, ABI42_0_0YGDisplay)

ABI42_0_0RCT_EXPORT_SHADOW_PROPERTY(onLayout, ABI42_0_0RCTDirectEventBlock)

ABI42_0_0RCT_EXPORT_SHADOW_PROPERTY(direction, ABI42_0_0YGDirection)

@end
